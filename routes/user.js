const express = require("express");
const query = require("../mySQL/connection");
const { genToken } = require("../utils");
const sha256 = require("sha256");
const router = express.Router();

router.post("/login", async (req, res) => {
  console.log("HELLO WORLD");
  const { email, password } = req.body;
  const hashed_password = sha256(process.env.SALT + password);
  const results = await query(
    `SELECT id 
      FROM users 
        WHERE email LIKE "${email}" 
          AND hashed_password 
            LIKE "${hashed_password}";`
  );

  if (results.length > 0) {
    const token = genToken();
    await query(
      `INSERT INTO tokens (user_id, token) VALUES ("${results[0].id}", "${token}")`
    );

    res.send({ status: 1, token });
  } else if (!email || !password) {
    res.status(400);
    res.send({ status: 0, error: "Missing Username or Password" });
  } else {
    res.status(400);
    res.send({ status: 0 });
  }

  console.log(genToken());
});

router.post("/signup", async (req, res) => {
  console.log("Here");
  const { email, password } = req.body;
  try {
    const hashed_password = sha256(process.env.SALT + password);
    const results = await query(
      `INSERT INTO users (email, hashed_password) 
        VALUES ('${email}', '${hashed_password}')`
    );
    console.log(results);
    res.send({ status: 1 });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      res.status(400);
      res.send({ status: 0, error: "Duplicate User" });
    } else {
      res.send({ status: 0, error: e });
    }
  }
});

module.exports = router;
