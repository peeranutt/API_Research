const express = require("express");
const multer = require('multer');
const db = require("../config.js");
const fs = require("fs");
const path = require("path");

router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads' //สร้างโฟเดอร์ 'uploads'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    cb(null, dir)
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname))
  }
})

const uploadDocuments = multer({
  storage,
  fileFilter: function (req, file, cb) {
    let acceptFile = true
    console.log('file woiiiii: ', file)
    if (file.fieldname == 'kris_file' && file.fieldname == 'full_page' && file.fieldname == 'ac_for_claim' && file.fieldname == 'q_proof' &&
      file.fieldname == 'call_for_paper' && file.fieldname == 'fee_receipt' && file.fieldname == 'fx_rate_document' && file.fieldname == 'conf_proof' &&
      file.fieldname == 'Pc_proof' && file.fieldname == 'q_pc_proof' && file.fieldname == 'Invoice' && file.fieldname == 'accepted') {
      if (file.mimetype == 'application/pdf') {
        acceptFile = true
      }
    }
    //ติดเงื่อนไขที่ ถ้าไม่ใช่ pdf จะไม่สามารถแอดได้  ---how to edit TT---
    else if (!acceptFile){
      console.log('not pdf ja')
      const message = `Field ${file.fieldname} wrong type (${file.mimetype})`
      !req.invalidFiles ? req.invalidFiles = [message] : req.invalidFiles.push(message)
    }

    cb(null, acceptFile)
  }
})

router.post('/pdf', uploadDocuments.fields([
  { name: 'kris_file' },
  { name: 'full_page' },
  { name: 'ac_for_claim' },
  { name: 'q_proof' },
  { name: 'call_for_paper' },
  { name: 'fee_receipt' },
  { name: 'fx_rate_document' },
  { name: 'conf_proof' },
  { name: 'Pc_proof' },
  { name: 'q_pc_proof' },
  { name: 'Invoice' },
  { name: 'accepted' },
]), async (req, res) => {

  console.log('wineeee')
  console.log(req.file)
  console.log(req.body)

  try {
    const { type, conf_id, pageC_id, kris_id } = req.body;
    const files = req.files;
    console.log('filesss',req.files)
    // if (!files.mimetype == 'application/pdf') {
    //   return res.status(400).json({ message: "Please upload a file PDF!!!!!!!!!!" });
    // }
    const data = {
      type,
      conf_id: conf_id || null,
      pageC_id: pageC_id || null,
      kris_id: kris_id || null,
      kris_file: files?.kris_file?.[0]?.filename || null,
      full_page: files?.full_page?.[0]?.filename || null,
      ac_for_claim: files?.ac_for_claim?.[0]?.filename || null,
      q_proof: files?.q_proof?.[0]?.filename || null,
      call_for_paper: files?.call_for_paper?.[0]?.filename || null,
      fee_receipt: files?.fee_receipt?.[0]?.filename || null,
      fx_rate_document: files?.fx_rate_document?.[0]?.filename || null,
      conf_proof: files?.conf_proof?.[0]?.filename || null,
      Pc_proof: files?.Pc_proof?.[0]?.filename || null,
      q_pc_proof: files?.q_pc_proof?.[0]?.filename || null,
      Invoice: files?.Invoice?.[0]?.filename || null,
      accepted: files?.accepted?.[0]?.filename || null,
    };
    const result = await db.query('INSERT INTO File_pdf SET ?', data);
    res.send({ message: 'File uploaded successfully', id: result.insertId });
  } catch (err) {
    res.status(500).send(err);
  }

});

router.get("/allpdf", async (req, res) => {
  try {
    const [allpdf] = await db.query("SELECT * FROM File_pdf");
    res.status(200).json(allpdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/pdfPC/:id", async (req, res) => {
  console.log("------------------------------------------")
  console.log("get pdf pc id")
  const { id } = req.params;
  try {
    const [pdf] = await db.query('SELECT * FROM File_pdf WHERE pageC_id = ?', [id]);
    if (pdf.length === 0) {
      return res.status(404).json({ message: 'File_pdf not found' });
    }
    console.log('Get File_pdf: ' ,pdf[0])
    res.status(200).json(pdf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/pdfConfer/:id", async (req, res) => {
  console.log("------------------------------------------")
  console.log("get pdf confer id")
  const { id } = req.params;
  try {
    const [pdf] = await db.query('SELECT * FROM File_pdf WHERE conf_id = ?', [id]);
    if (pdf.length === 0) {
      return res.status(404).json({ message: 'File_pdf not found' });
    }
    console.log('Get File_pdf: ' ,pdf[0])
    res.status(200).json(pdf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;