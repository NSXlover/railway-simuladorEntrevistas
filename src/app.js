"use strict"

//Importar paquete necesario
import express from 'express';
import {pool} from  './db.js';
import {PORT} from './config.js';

const app = express();

app.get('/', (req, res) =>{
    res.send("Realice un ping para comprobar si existe una conexión");
});

//Solicitud para comprobar la conexión
app.get('/ping', async (req, res) =>{
    const [result] =  await pool.query('SELECT "Conexión satisfactoria" AS RESULT');
    console.log(result[0]);
    res.json(result[0]);
});

//Sentencia de creación de usuarios con contraseñas cifradas
app.post('/createUser', async (req, res) => { //Ruta y método HTTP
    const { usuario, contrasena } = req.body; //Se extraen los datos de la solicitud en las variables respectivamente

    // Generar un salt aleatorio
    const salt = crypto.randomBytes(16).toString('hex'); //Esto sirve para añadirle una cadena aleatoria antes de aplicar el hash y así mejorar la seguridad

    // Aplicar hash a la contraseña junto con el salt aplicando el sha256
    const hashedContrasena = crypto
        .createHash('sha256')
        .update(contrasena + salt)
        .digest('hex');

    try {
        // Insertar el nuevo usuario con el nombre de usuario, contraseña y salt
        const result = await pool.query(
            'INSERT INTO usuarios(usuario, contrasena) VALUES (?, ?)',
            [usuario, hashedContrasena]
        );

        res.json(result); //Envío de la respuesta al cliente

    } catch (error) { //Manejo de errores
        console.error('Error al crear el usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});


//Consulta de todos los ususarios
app.get('/selectAllUsers', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT usuario FROM usuarios'); //seleccionamos los usuarios
        res.json(result); //Devolvemos el resultado

    } catch (error) { //Manejo de errores
        console.error('Error al seleccionar todos los usuarios:', error);
        res.status(500).send('Error interno del servidor');
    }
});

//Consulta del ID más alto
app.get('/getMaxUserId', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT MAX(ID) as maxUserId FROM usuarios');
        res.json(result[0]);
        
    } catch (error) {
        console.error('Error al obtener el ID máximo de usuarios:', error);
        res.status(500).send('Error interno del servidor');
    }
});

//Reseteo del autoincremental
app.get('/resetAutoIncrement', async (req, res) => {
    try {
        // Resetear AUTO_INCREMENT a 1
        await pool.query('ALTER TABLE usuarios AUTO_INCREMENT = 1');

        // Consulta para obtener el nuevo valor de incremento automático
        const [result] = await pool.query('SELECT AUTO_INCREMENT as newAutoIncrementValue FROM information_schema.tables WHERE table_name = "usuarios" AND table_schema = DATABASE()');

        res.json(result[0]);
    } catch (error) {
        console.error('Error al resetear el AUTO_INCREMENT:', error);
        res.status(500).send('Error interno del servidor');
    }
});


//Añadimos preguntas para cada usuario que pasamos por parámetro
app.get('/addQuestion/:question', async (req, res) =>{
    const question = req.params.question; //extraemos el parámetro de la ruta anterior
    const result = await pool.query('INSERT INTO preguntas(question) VALUES (?)', [nombreUsuario]); //consulta SQL
    res.json(result); //Reenvío de la respuesta al cliente
});

//Consultamos las preguntas para cada usuario
app.get('/getQuestions/:usuario', async (req, res) => {
    const usuario = req.params.usuario; // Extraemos el parámetro de la ruta

    try {
        const [result] = await pool.query('SELECT question FROM preguntas WHERE usuario = ?', [usuario]);
        res.json(result);

    } catch (error) {
        console.error('Error al obtener las preguntas del usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(PORT);
console.log('Conexión con la bbdd exitosa');



