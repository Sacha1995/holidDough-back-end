const express = require("express");
const query = require("../mySQL/connection");
const router = express.Router();
const Joi = require("joi");
const {
  addSplit,
  deleteMultiSplits,
  deleteSingleSplits,
  makePaidTrue,
  makePaidMulitTrue,
} = require("../mySQL/queries");

const schema = Joi.object({
  date: Joi.number().required(),
  amount: Joi.object({
    fromValue: Joi.number().required(),
    toValue: Joi.number().required(),
    fromCurrency: Joi.string().required(),
    toCurrency: Joi.string().required(),
  }),
  paid: Joi.boolean().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  id: Joi.string().required(),
  expenseId: Joi.string().required(),
  sharedId: Joi.string().allow(null),
});

router.post("/", async (req, res) => {
  const validation = schema.validate(req.body.billSplit, { abortEarly: false });

  if (validation.error) {
    // console.log("Error", validation.error);
    res.status(418).send({ status: 0 });
    return;
  }

  const {
    date,
    amount,
    paid,
    name,
    description,
    id,
    expenseId,
    sharedId = "",
  } = req.body.billSplit;
  const { fromValue, fromCurrency, toValue, toCurrency } = amount;

  // If it does then deconstruct the request and send into query
  const params = [
    id,
    expenseId,
    sharedId,
    name,
    description,
    date,
    Number(paid),
    fromValue,
    fromCurrency,
    toValue,
    toCurrency,
  ];
  try {
    const result = await query(addSplit(), params);
    // console.log(result);
  } catch (e) {
    // console.log(e);
    res
      .status(418)
      .send({ status: 0, message: "could not put split in database" });
  }

  res.send({ status: 1 });
});

router.delete("/shared/:id", async (req, res) => {
  const id = req.params.id;
  const userId = req.userId;

  // check the sharedId
  if (typeof id !== "string" || id.length !== 31 || !id.includes("sharedId")) {
    return res.status(404).send({
      status: 0,
      message: `Wrong Id`,
    });
  }

  try {
    const result = await query(deleteMultiSplits(), [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).send({
        status: 0,
        message: `splits not found`,
      });
    }

    // console.log(`Deleted ${result.affectedRows} splits with shared_id: ${id}`);
    res.send({ status: 1, message: `Deleted splits` });
  } catch (error) {
    // console.error(`Error deleting splits with shared_id: ${id}`, error);
    res.status(400).send({
      status: 0,
      message: "Failed to delete splits",
    });
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const userId = req.userId;

  // need to add checks for id
  if (typeof id !== "string" || id.length !== 30 || !id.includes("expense")) {
    return res.status(404).send({
      status: 0,
      message: `Wrong Id`,
    });
  }

  try {
    const result = await query(deleteSingleSplits(), [id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ status: 0, message: `Split not found` });
    }

    // console.log(`Deleted split with id: ${id}`);
    res.send({
      status: 1,
      message: `Delete successful`,
    });
  } catch (error) {
    // console.error(`Error deleting split with id: ${id}`, error);
    res.status(400).send({
      status: 0,
      message: "Failed to delete split",
    });
  }
});

router.patch("/paid/:id/:name", async (req, res) => {
  const id = req.params.id;
  const name = req.params.name;

  if (id.includes("shared")) {
    try {
      const result = await query(makePaidMulitTrue(), [id, name]);
      if (result.affectedRows === 0) {
        return res.status(404).send({
          status: 0,
          message: `Splits not found`,
        });
      }
      res.send({
        status: 1,
        message: `Splits changed to paid`,
      });
      return;
    } catch (e) {
      // console.log(
      //   `Error changing splits with sharedId: ${id} and name ${name}`,
      //   e
      // );
      res
        .status(400)
        .send({ status: 0, message: "Failed to turn paid into true" });
      return;
    }
  }

  try {
    const result = await query(makePaidTrue(), [id, name]);
    if (result.affectedRows === 0) {
      return res.status(404).send({
        status: 0,
        message: `Split not found`,
      });
    }
    res.send({
      status: 1,
      message: `Split changed to paid`,
    });
    return;
  } catch (e) {
    // console.log(`Error changing split with id: ${id} and name ${name}`, e);
    res
      .status(400)
      .send({ status: 0, message: "Failed to turn paid into true" });
    return;
  }
});

module.exports = router;
