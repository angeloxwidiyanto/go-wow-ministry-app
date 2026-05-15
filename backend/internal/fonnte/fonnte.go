package fonnte

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

const apiURL = "https://api.fonnte.com/send"
const deviceURL = "https://api.fonnte.com/device"

// SendResult is the result of a SendWhatsApp call.
type SendResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// DeviceInfo contains device information from the Fonnte API.
type DeviceInfo struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Device  string `json:"device,omitempty"`
}

// NormalizePhone normalizes an Indonesian phone number to Fonnte's expected format (628xxx).
//
//	"08123456789"   → "628123456789"
//	"8123456789"    → "628123456789"
//	"+628123456789" → "628123456789"
//	"628123456789"  → "628123456789"
func NormalizePhone(raw string) string {
	// Strip everything except digits
	var digits strings.Builder
	for _, ch := range raw {
		if ch >= '0' && ch <= '9' {
			digits.WriteRune(ch)
		}
	}
	d := digits.String()

	switch {
	case strings.HasPrefix(d, "62"):
		return d // already has country code
	case strings.HasPrefix(d, "0"):
		return "62" + d[1:] // 0xxx → 62xxx
	case strings.HasPrefix(d, "8"):
		return "62" + d // 8xxx → 628xxx
	default:
		return d // Fonnte will reject invalid numbers
	}
}

// SendWhatsApp sends a WhatsApp message via the Fonnte API.
func SendWhatsApp(token, target, message string) SendResult {
	if token == "" {
		return SendResult{Success: false, Message: "Fonnte token is not configured."}
	}

	normalized := NormalizePhone(target)

	body := url.Values{
		"target":      {normalized},
		"message":     {message},
		"countryCode": {"62"},
	}

	req, err := http.NewRequest(http.MethodPost, apiURL, strings.NewReader(body.Encode()))
	if err != nil {
		return SendResult{Success: false, Message: fmt.Sprintf("failed to create request: %v", err)}
	}
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return SendResult{Success: false, Message: fmt.Sprintf("network error: %v", err)}
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(raw, &result); err != nil {
		return SendResult{Success: false, Message: "invalid response from Fonnte"}
	}

	if status, ok := result["status"].(bool); ok && status {
		return SendResult{Success: true, Message: "Message sent successfully."}
	}

	reason, _ := result["reason"].(string)
	if reason == "" {
		reason = "Failed to send message."
	}
	return SendResult{Success: false, Message: reason}
}

// TestToken tests a Fonnte token by calling the device status endpoint.
func TestToken(token string) DeviceInfo {
	if token == "" {
		return DeviceInfo{Success: false, Message: "Token is empty."}
	}

	req, err := http.NewRequest(http.MethodGet, deviceURL, nil)
	if err != nil {
		return DeviceInfo{Success: false, Message: fmt.Sprintf("failed to create request: %v", err)}
	}
	req.Header.Set("Authorization", token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return DeviceInfo{Success: false, Message: fmt.Sprintf("network error: %v", err)}
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(raw, &result); err != nil {
		return DeviceInfo{Success: false, Message: "invalid response from Fonnte"}
	}

	if status, ok := result["status"].(bool); ok && status {
		device, _ := result["name"].(string)
		if device == "" {
			device, _ = result["device"].(string)
		}
		return DeviceInfo{Success: true, Message: "Token is valid. Device is connected.", Device: device}
	}

	reason, _ := result["reason"].(string)
	if reason == "" {
		reason = "Token is invalid or device is disconnected."
	}
	return DeviceInfo{Success: false, Message: reason}
}
