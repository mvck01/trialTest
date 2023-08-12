import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Pool } from 'pg';
import cors from 'cors';

interface Person {
  personid: number;
  firstname: string;
  lastname: string;
  phonenumber?: string;
  address?: string;
}

const pool = new Pool({
  user: 'dandi',
  host: 'database-1.ccldas9hkk97.ap-southeast-2.rds.amazonaws.com',
  database: 'postgres',
  password: 'localman',
  port: 5432, // Default PostgreSQL port
  ssl: { rejectUnauthorized: false}
});

const app = express();
app.use(bodyParser.json());
app.use(cors())
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, this is the root path!');
  });
  

// Create a new person
app.post('/persons', async (req: Request, res: Response) => {
  const { firstname, lastname, phonenumber, address } = req.body;
  if (!firstname || !lastname) {
    return res.status(400).json({ error: 'First name and last name are required.' });
  }

  try {
    const query = 'INSERT INTO persons (firstname, lastname, phonenumber, address) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [firstname, lastname, phonenumber, address];
    const result = await pool.query(query, values);

    const newPerson: Person = result.rows[0];
    return res.status(201).json(newPerson);
  } catch (error) {
    console.error('Error creating person:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Read all persons
app.get('/persons', async (req: Request, res: Response) => {
  try {
    const query = 'SELECT * FROM persons';
    const result = await pool.query(query);

    const persons: Person[] = result.rows;
    return res.json(persons);
  } catch (error) {
    console.error('Error fetching persons:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Read a specific person by ID
app.get('/persons/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  try {
    const query = 'SELECT * FROM persons WHERE personid = $1';
    const result = await pool.query(query, [id]);

    const person: Person = result.rows[0];
    if (!person) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    return res.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update a person by ID
app.put('/persons/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { firstname, lastname, phonenumber, address } = req.body;

  try {
    const query = 'UPDATE persons SET firstname = $1, lastname = $2, phonenumber = $3, address = $4 WHERE personid = $5 RETURNING *';
    const values = [firstname, lastname, phonenumber, address, id];
    const result = await pool.query(query, values);

    const updatedPerson: Person = result.rows[0];
    if (!updatedPerson) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    return res.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete a person by ID
app.delete('/persons/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  try {
    const query = 'DELETE FROM persons WHERE personid = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    const deletedPerson: Person = result.rows[0];
    if (!deletedPerson) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    return res.json(deletedPerson);
  } catch (error) {
    console.error('Error deleting person:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
