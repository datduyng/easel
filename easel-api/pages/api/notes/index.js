import { getMongoDbClient } from "../../../lib/mongodb.server";
// export handler
export default async function handler(req, res) {
    // AVOID CORS error and support OPTION

    res.setHeader('Access-Control-Allow-Origin', '*');
    // set the response header to allow all methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    // set the response header to allow all headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // check if the request method is OPTIONS
    if (req.method === 'OPTIONS') {
        // set the response status code to 200
        res.status(200);
        // set the response header to allow all origins

        // end the response
        res.end();
        // return
        return;
    }

    const db = await getMongoDbClient();

    const userId = "user id";

    if (req.method === 'POST') {
        // create a new note and save to mongo db
        const note = req.body;
        if (!note || !note.noteId) {
            return res.status(400).json({ error: 'noteId is required' });
        }
        note.userId = userId;
        const result = await db.collection('notes')
            .insertOne(note);
        note._id = result.insertedId;
        return res.status(201).json(note);
    } else if (req.method === 'PUT') {
        // update a note
        const note = req.body;
        if (!note || !note.noteId) {
            return res.status(400).json({ error: 'id is required' });
        }
        note.userId = userId;
        delete note._id;

        // const result = await db.collection('notes')
        //     .replaceOne({ noteId: note.noteId }, note);
        // update or create if not exists
        const result = await db.collection('notes')
            .updateOne({ noteId: note.noteId }, { $set: note }, { upsert: true });

        return res.status(200).json(result);
    } else if (req.method === 'GET') {
        // if id is specified in the query string, return a single note
        const { id, lightData } = req.query;
        if (id) {
            const note = await db.collection('notes')
                .findOne({ noteId: id, userId });
            return res.status(200).json(note);
        }

        if (lightData !== undefined) {
            const notes = await db.collection('notes')
                .find({ userId })
                // project all field except content
                .project({ content: 0 })
                .toArray();
            return res.status(200).json(notes);
        }

        // get all note by user id
        const notes = await db.collection('notes')
            .find({ userId })
            .toArray();
        return res.status(200).json(notes);
    } else if (req.method === 'DELETE') {
        // delete a note
        const noteId = req.query.id;
        if (!noteId) {
            return res.status(400).json({ error: 'id is required' });
        }
        const result = await db.collection('notes')
            .deleteOne({ noteId });
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}