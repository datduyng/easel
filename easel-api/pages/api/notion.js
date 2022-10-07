// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Cors from 'cors'
import { Client } from "@notionhq/client";
// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ['POST', 'GET', 'HEAD', 'PATCH'],
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req,
  res,
  fn
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}


const NOTION_SECRET =
    "secret_gu2GH4PoSsLdYuFodvAiecODmA6uu02laooSLUkrMSP";

const notionClient = new Client({
    auth: NOTION_SECRET,
    notionVersion: "2021-05-13",
    baseUrl: "http://localhost:3000/api?endpoint=https://api.notion.com",
});

const notionDbId = "f36eba38aa3f413786fad37c690e474c";

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    try {
        if (req.method === "POST" || req.method === "PATCH") {
            const { endpoint } = req.query;
            const result = await fetch(endpoint, {
                method: req.method,
                headers: {
                    "Content-Type": "application/json",
                    "Notion-Version": "2021-05-13",
                    Authorization: `Bearer ${NOTION_SECRET}`,
                },
                body: JSON.stringify(req.body),
            });
            const json = await result.json();
            console.log('json', json);
            return res
                .status(result.status)
                .json(json);
        }
        return res.status(400).json({ message: "Bad request" });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: e });
    }
}
