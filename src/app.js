"use strict"

//Importar paquete necesario
import express from 'express';
import crypto from 'crypto';
import { pool } from './db.js';
import { PORT } from './config.js';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());

const corsOptions = {
    origin: '*', // Permite solicitudes solo desde este origen
    methods: ['GET', 'POST'], // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
    credentials: true, // Permite el envío de cookies
    maxAge: 3600, // Tiempo máximo de vida de las solicitudes preflight (en segundos)
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.send("Realice un ping para comprobar si existe una conexión");
});


//Solicitud para comprobar la conexión
app.get('/ping', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT "Conexión satisfactoria" AS RESULT');
        console.log(result[0]);
        res.json(result[0]);
    } catch (error) {
        console.error('Error al realizar el ping:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


//Sentencia de creación de usuarios con contraseñas cifradas
app.post('/createUser', async (req, res) => { //Ruta y método HTTP

    //Se extraen los datos de la solicitud en las variables respectivamente
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;

    console.log(usuario + " || " + contrasena);

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


//Login
app.get('/login', async (req, res) => {
    //Se extraen los datos de la solicitud en las variables respectivamente
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;

    try {
        // Buscar el usuario por nombre de usuario
        const [result] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

        console.log(result);

        if (result.length > 0) {
            // Si se encuentra el usuario, comparar contraseñas
            const hashedContrasenaDB = result[0].contrasena;

            // Comparar la contraseña proporcionada con la almacenada en la base de datos
            const contrasenaCorrecta = await bcrypt.compare(contrasena, hashedContrasenaDB);

            if (contrasenaCorrecta) {
                // Contraseña correcta, usuario autenticado
                alert('Inicio de sesión exitoso');
                res.json({ authenticated: true, message: 'Inicio de sesión exitoso' });
            } else {
                // Contraseña incorrecta
                alert('Contraseña incorrecta');
                res.json({ authenticated: false, message: 'Contraseña incorrecta' });
            }
        } else {
            // Usuario no encontrado
            alert('Usuario no encontrado');
            res.json({ authenticated: false, message: 'Usuario no encontrado' });
        }

    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert('Error al realizar la solicitud: ' + error.message);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            // Error de acceso a la base de datos, verifica las credenciales de la base de datos
            res.status(500).json({ error: 'Error de acceso a la base de datos' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
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

//Consulta del ID de un usuario
app.get('/getUserID/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const [result] = await pool.query('SELECT ID FROM usuarios WHERE usuario = ?', [username]);

        if (result.length > 0) {
            const userID = result[0].ID;
            res.json({ userID });
        } else {
            res.json({ userID: null, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el ID de usuario:', error);
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
app.post('/addQuestion/:userID/:question', async (req, res) => {
    const userID = req.params.userID;
    const question = req.params.question;

    try {
        const result = await pool.query('INSERT INTO preguntas (IDusuario, preguntas) VALUES (?, ?)', [userID, question]);
        res.json(result);
    } catch (error) {
        console.error('Error al añadir pregunta:', error);
        res.status(500).send('Error interno del servidor');
    }
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



