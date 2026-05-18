package chat

import (
	"api/_internal/auth"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiContent struct {
	Role  string       `json:"role"`
	Parts []GeminiPart `json:"parts"`
}

type GoogleSearch struct{}

type GeminiTool struct {
	GoogleSearch *GoogleSearch `json:"googleSearch,omitempty"`
}

type GeminiSystemInstruction struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiRequest struct {
	Contents          []GeminiContent          `json:"contents"`
	Tools             []GeminiTool             `json:"tools,omitempty"`
	SystemInstruction *GeminiSystemInstruction `json:"systemInstruction,omitempty"`
}

type WebSource struct {
	URI   string `json:"uri"`
	Title string `json:"title"`
}

type GroundingChunk struct {
	Web *WebSource `json:"web,omitempty"`
}

type GroundingMetadata struct {
	WebSearchQueries []string         `json:"webSearchQueries,omitempty"`
	GroundingChunks  []GroundingChunk `json:"groundingChunks,omitempty"`
}

type Candidate struct {
	Content           GeminiContent      `json:"content"`
	GroundingMetadata *GroundingMetadata `json:"groundingMetadata,omitempty"`
}

type GeminiResponse struct {
	Candidates []Candidate `json:"candidates"`
}

type ChatRequest struct {
	Prompt  string          `json:"prompt"`
	History []GeminiContent `json:"history,omitempty"`
}

type ChatResponse struct {
	Response string `json:"response"`
}

// Handler procesa la solicitud de chat con el modelo Gemini de Google.
func Handler(w http.ResponseWriter, r *http.Request) {
	auth.CORSMiddleware(func(w http.ResponseWriter, r *http.Request) {
		auth.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
				return
			}

			// 1. Verificar si la clave API de Gemini está configurada
			apiKey := os.Getenv("GEMINI_API_KEY")
			if apiKey == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{
					"error": "La API Key de Gemini no está configurada. Por favor, crea una clave API gratuita en Google AI Studio (https://aistudio.google.com/) y configúrala como GEMINI_API_KEY en tu archivo .env para activar el asistente clínico.",
				})
				return
			}

			// 2. Decodificar la solicitud del cliente
			var chatReq ChatRequest
			if err := json.NewDecoder(r.Body).Decode(&chatReq); err != nil {
				http.Error(w, "Formato de solicitud inválido", http.StatusBadRequest)
				return
			}

			if chatReq.Prompt == "" {
				http.Error(w, "El prompt no puede estar vacío", http.StatusBadRequest)
				return
			}

			// 3. Preparar la estructura del cuerpo para Gemini
			var contents []GeminiContent
			contents = append(contents, chatReq.History...)
			contents = append(contents, GeminiContent{
				Role:  "user",
				Parts: []GeminiPart{{Text: chatReq.Prompt}},
			})

			geminiReq := GeminiRequest{
				Contents: contents,
				Tools: []GeminiTool{
					{
						GoogleSearch: &GoogleSearch{},
					},
				},
				SystemInstruction: &GeminiSystemInstruction{
					Parts: []GeminiPart{
						{
							Text: "Eres un asistente de investigación clínica y farmacológica altamente especializado respaldado por el motor de búsqueda de Google. Tu principal función es asistir a profesionales de la salud a buscar y sintetizar información médica actualizada en la web en tiempo real (como interacciones, dosificaciones recientes y guías clínicas). Siempre proporciona enlaces y fuentes reales. Mantén un tono sumamente ético y profesional, recordando que el criterio del médico colegiado es soberano.",
						},
					},
				},
			}

			reqBody, err := json.Marshal(geminiReq)
			if err != nil {
				log.Printf("❌ ERROR: Al serializar solicitud para Gemini: %v", err)
				http.Error(w, "Error interno de servidor", http.StatusInternalServerError)
				return
			}

			// 4. Realizar la solicitud HTTP a Google Gemini API
			// Usamos gemini-2.5-flash-lite ya que es altamente estable, veloz y tiene muchísima mejor disponibilidad bajo demanda
			apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=%s", apiKey)

			resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(reqBody))
			if err != nil {
				log.Printf("❌ ERROR: Al conectar con la API de Gemini: %v", err)
				http.Error(w, "Error de conexión con el motor de IA de Google", http.StatusInternalServerError)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				bodyBytes, _ := io.ReadAll(resp.Body)
				log.Printf("❌ ERROR: Gemini API devolvió status %d. Respuesta: %s", resp.StatusCode, string(bodyBytes))

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(resp.StatusCode)
				json.NewEncoder(w).Encode(map[string]string{
					"error": fmt.Sprintf("El motor de Gemini devolvió un error (código %d).", resp.StatusCode),
				})
				return
			}

			// 5. Decodificar la respuesta de Gemini
			var geminiResp GeminiResponse
			if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
				log.Printf("❌ ERROR: Al decodificar respuesta de Gemini: %v", err)
				http.Error(w, "Error al procesar respuesta del motor de IA", http.StatusInternalServerError)
				return
			}

			if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
				http.Error(w, "No se generó ninguna respuesta", http.StatusInternalServerError)
				return
			}

			candidate := geminiResp.Candidates[0]
			responseText := candidate.Content.Parts[0].Text

			// 6. Formatear y añadir las fuentes web consultadas en tiempo real (si existen)
			var sourceMarkdown string
			if candidate.GroundingMetadata != nil && len(candidate.GroundingMetadata.GroundingChunks) > 0 {
				sourceMarkdown = "\n\n**Fuentes de búsqueda de Google:**\n"
				seen := map[string]bool{}
				addedSources := 0
				for _, chunk := range candidate.GroundingMetadata.GroundingChunks {
					if chunk.Web != nil && chunk.Web.URI != "" {
						title := chunk.Web.Title
						if title == "" {
							title = chunk.Web.URI
						}
						// Evitamos enlaces duplicados
						if !seen[chunk.Web.URI] {
							seen[chunk.Web.URI] = true
							sourceMarkdown += fmt.Sprintf("- [%s](%s)\n", title, chunk.Web.URI)
							addedSources++
						}
					}
				}
				if addedSources == 0 {
					sourceMarkdown = "" // No se agregaron fuentes válidas
				}
			}

			// Unimos la respuesta base con el bloque de referencias/fuentes
			finalResponse := responseText + sourceMarkdown

			// 7. Responder al cliente
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(ChatResponse{Response: finalResponse})
		})(w, r)
	})(w, r)
}
