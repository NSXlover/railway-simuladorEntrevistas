"use strict"

//Importar paquete necesario
import express from 'express';
import {pool} from  './db.js';
import {PORT} from './config.js';

const app = express();

app.get('/', (req, res) =>{
    res.send("Welcome");
}) 

app.get('/ping', async (req, res) =>{
    const [result] =  await pool.query('SELECT "Conexión satisfactoria" AS RESULT');
    console.log(result[0]);
    res.json(result[0]);
})

app.get('/createUsers', async (req, res) =>{
    const result =  await pool.query('INSERT INTO usuarios(usuario) VALUES ("usuario")');
    res.json(result);
})

app.get('/selectAllUsers', async (req, res) =>{
    const [result] =  await pool.query('SELECT * FROM usuarios as USUARIOS');
    res.json(result);
})

app.get('/create', async (req, res) =>{
    await pool.query()
}) 

app.listen(PORT);
console.log('Conexión con la bbdd exitosa');



