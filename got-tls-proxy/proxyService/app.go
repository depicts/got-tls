package proxy

import (
	"bytes"
	"compress/gzip"
	"compress/zlib"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/fatih/color"

	"github.com/Carcraftz/cclient"
	"github.com/andybalholm/brotli"

	http "github.com/Carcraftz/fhttp"
	tls "github.com/Carcraftz/utls"
)

func log(t string, request RequestData, message string) {
	if request.Debug == true {
		now := time.Now().Format("2006-01-02 15:04:05.000000")
		magenta := color.New(color.FgMagenta).SprintFunc()
		if t == "info" {
			cyan := color.New(color.FgCyan).SprintFunc()
			yellow := color.New(color.FgYellow).SprintFunc()
			fmt.Printf("[%s] [%s] > %s.\n", magenta(now), yellow(request.ID), cyan(message))
		}
		if t == "error" {
			red := color.New(color.FgRed).SprintFunc()
			yellow := color.New(color.FgYellow).SprintFunc()
			fmt.Printf("[%s] [%s] > %s.\n", magenta(now), yellow(request.ID), red(message))
		}
		if t == "success" {
			green := color.New(color.FgGreen).SprintFunc()
			yellow := color.New(color.FgYellow).SprintFunc()
			fmt.Printf("[%s] [%s] > %s.\n", magenta(now), yellow(request.ID), green(message))
		}
	}
}

func ProxyRequest(data []byte) ResponseData {

	var requestData RequestData
	var allowRedirect = true
	var timeout = 20
	var err error

	if err = json.Unmarshal(data, &requestData); err != nil {
		return ResponseData{
			Success: false,
			Message: "Error: Invalid Request Data",
		}
	}

	var responseData = ResponseData{
		ID:     requestData.ID,
		Method: requestData.Method,
		URL:    requestData.URL,
	}

	log("info", requestData, "Starting...")

	if requestData.URL == "" {
		log("error", requestData, "Missing Request Url")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Missing Request Url",
		}
	}

	if requestData.Method == "" {
		log("error", requestData, "Missing Request Method")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Missing Request Method",
		}
	}

	if len(requestData.Headers) == 0 {
		log("error", requestData, "Missing Request Headers")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Missing Request Headers",
		}
	}

	if requestData.Headers["User-Agent"] == "" {
		log("error", requestData, "Missing UserAgent")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Missing UserAgent",
		}
	}

	if requestData.Redirect == false {
		allowRedirect = false
	}

	if requestData.Timeout != "" {
		timeout, err = strconv.Atoi(requestData.Timeout)
		if err != nil {
			timeout = 20
		}
	}

	if timeout > 60 {
		log("error", requestData, "Timeout Cannot Be Longer Than 60 Seconds")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Timeout Cannot Be Longer Than 60 Seconds",
		}
	}

	var tlsClient tls.ClientHelloID

	if strings.Contains(strings.ToLower(requestData.Headers["User-Agent"]), "chrome") {
		tlsClient = tls.HelloChrome_Auto
	} else if strings.Contains(strings.ToLower(requestData.Headers["User-Agent"]), "firefox") {
		tlsClient = tls.HelloFirefox_Auto
	} else {
		tlsClient = tls.HelloIOS_Auto
	}

	client, err := cclient.NewClient(tlsClient, requestData.Proxy, allowRedirect, time.Duration(timeout))

	if err != nil {
		log("error", requestData, "Failed To Initiate Request")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Failed To Initiate Request",
		}
	}

	var req *http.Request

	req, err = http.NewRequest(requestData.Method, requestData.URL, bytes.NewBuffer([]byte(requestData.Body)))

	if err != nil {
		log("error", requestData, "Failed To Execute Request")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Failed To Execute Request",
		}
	}

	headermap := make(map[string]string)

	headerorderkey := []string{}

	for _, key := range Masterheaderorder {
		for k, v := range requestData.Headers {
			lowercasekey := strings.ToLower(k)
			if key == lowercasekey {
				headermap[k] = v
				headerorderkey = append(headerorderkey, lowercasekey)
			}
		}
	}

	req.Header = http.Header{
		http.HeaderOrderKey:  headerorderkey,
		http.PHeaderOrderKey: {":method", ":authority", ":scheme", ":path"},
	}

	for k, v := range req.Header {
		if _, ok := headermap[k]; !ok {
			headermap[k] = v[0]
			headerorderkey = append(headerorderkey, strings.ToLower(k))
		}
	}

	for k, v := range requestData.Headers {
		if k != "Content-Length" && !strings.Contains(k, "Poptls") {
			req.Header.Set(k, v)
		}
	}

	u, err := url.Parse(requestData.URL)
	if err != nil {
		log("error", requestData, "Failed To Get Host")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Failed To Get Host",
		}
	}

	req.Header.Set("Host", u.Host)

	resp, err := client.Do(req)

	if err != nil {
		log("error", requestData, "Failed Request "+err.Error())
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Failed Request " + err.Error(),
		}
	}

	defer resp.Body.Close()

	responseData.Headers = map[string][]interface{}{}

	for k, v := range resp.Header {
		if k != "Content-Length" && k != "Content-Encoding" {
			for _, kv := range v {
				responseData.Headers[k] = append(responseData.Headers[k], kv)
			}
		}
	}

	responseData.StatusCode = resp.StatusCode

	encoding := resp.Header["Content-Encoding"]

	body, err := ioutil.ReadAll(resp.Body)

	finalres := ""

	if err != nil {
		log("error", requestData, "Failed Request - Getting Content")
		return ResponseData{
			ID:      requestData.ID,
			Success: false,
			Message: "Error: Failed Request - Getting Content",
		}
	}

	finalres = string(body)

	if len(encoding) > 0 {
		if encoding[0] == "gzip" {
			unz, err := gUnzipData(body)
			if err != nil {
				panic(err)
			}
			finalres = string(unz)
		} else if encoding[0] == "deflate" {
			unz, err := enflateData(body)
			if err != nil {
				panic(err)
			}
			finalres = string(unz)
		} else if encoding[0] == "br" {
			unz, err := unBrotliData(body)
			if err != nil {
				panic(err)
			}
			finalres = string(unz)
		} else {
			finalres = string(body)
		}
	} else {
		finalres = string(body)
	}

	responseData.Success = true
	responseData.Body = finalres

	log("success", requestData, "Request Successfully Proxied")

	return responseData
}

func gUnzipData(data []byte) (resData []byte, err error) {
	gz, _ := gzip.NewReader(bytes.NewReader(data))
	defer gz.Close()
	respBody, err := ioutil.ReadAll(gz)
	return respBody, err
}
func enflateData(data []byte) (resData []byte, err error) {
	zr, _ := zlib.NewReader(bytes.NewReader(data))
	defer zr.Close()
	enflated, err := ioutil.ReadAll(zr)
	return enflated, err
}
func unBrotliData(data []byte) (resData []byte, err error) {
	br := brotli.NewReader(bytes.NewReader(data))
	respBody, err := ioutil.ReadAll(br)
	return respBody, err
}
