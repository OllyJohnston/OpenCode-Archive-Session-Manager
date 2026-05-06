import { createOpencodeClient } from "@opencode-ai/sdk"

async function debug() {
  const client = createOpencodeClient({ baseUrl: "http://localhost:4096" })
  try {
    const res = await client.session.list()
    console.log("Response Type:", typeof res)
    console.log("Response Keys:", Object.keys(res))
    if (res.data) {
      console.log("Data is an array:", Array.isArray(res.data))
      console.log("Data length:", res.data.length)
    } else {
      console.log("Response is an array:", Array.isArray(res))
      if (Array.isArray(res)) console.log("Response length:", res.length)
    }
  } catch (e) {
    console.error("Error:", e.message)
  }
}

debug()
