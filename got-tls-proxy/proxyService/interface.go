package proxy

type RequestData struct {
	ID       string            `json:"id"`
	Debug    bool              `json:"debug"`
	Method   string            `json:"method"`
	URL      string            `json:"url"`
	Proxy    string            `json:"proxy"`
	Headers  map[string]string `json:"headers"`
	Body     string            `json:"body"`
	Timeout  string            `json:"timeout"`
	Redirect bool              `json:"redirect"`
}

type ResponseData struct {
	ID         string                   `json:"id"`
	Method     string                   `json:"method"`
	StatusCode int                      `json:"statusCode"`
	URL        string                   `json:"url"`
	Headers    map[string][]interface{} `json:"headers"`
	Body       string                   `json:"body"`
	Success    bool                     `json:"success"`
	Message    string                   `json:"message"`
}

var Masterheaderorder = []string{
	"host",
	"connection",
	"cache-control",
	"device-memory",
	"viewport-width",
	"rtt",
	"downlink",
	"ect",
	"sec-ch-ua",
	"sec-ch-ua-mobile",
	"sec-ch-ua-full-version",
	"sec-ch-ua-arch",
	"sec-ch-ua-platform",
	"sec-ch-ua-platform-version",
	"sec-ch-ua-model",
	"upgrade-insecure-requests",
	"user-agent",
	"accept",
	"sec-fetch-site",
	"sec-fetch-mode",
	"sec-fetch-user",
	"sec-fetch-dest",
	"referer",
	"accept-encoding",
	"accept-language",
	"cookie",
}
