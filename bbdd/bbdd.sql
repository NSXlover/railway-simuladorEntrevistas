/* SCRIPTS PARA LA CREACIÓN DE LAS TABLAS
CREATE TABLE usuarios (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255)
);


CREATE TABLE preguntas (
    IDusuario INT,
    preguntas TEXT,
    FOREIGN KEY (IDusuario) REFERENCES usuarios(ID)
);

CREATE TABLE videos (
    videoID INT AUTO_INCREMENT PRIMARY KEY,
    IDusuario INT,
    CONSTRAINT fk_usuario FOREIGN KEY (IDusuario) REFERENCES usuarios(ID)
);
*/
