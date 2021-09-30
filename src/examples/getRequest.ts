import { Server, got } from "../index";

export const getRequest = async() => {
    Server.connect()
    let response = await got("https://httpbin.org/anything", "GET", {
        headers: {
            "User-Agent": "test"
        }
    })
    console.log(response?.statusCode)
    console.log(response?.headers)
}

getRequest()