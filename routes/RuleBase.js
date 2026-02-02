const express = require("express");
const db = require("../config.js");
const country = require("./Country.json");

router = express.Router();

async function getConditionPC() {
  try {
    const [result] = await db.query(`
      SELECT * FROM ConditionPC
      ORDER BY condition_id DESC
      LIMIT 1;`);
    return result;
  } catch (error) {
    console.error("Error fetching ConditionPC:", error);
    throw error;
  }
}

async function getConditionCF() {
  try {
    const [result] = await db.query(`
      SELECT * FROM ConditionCF
      ORDER BY condition_id DESC
      LIMIT 1;`);
    return result;
  } catch (error) {
    console.error("Error fetching ConditionCF:", error);
    throw error;
  }
}

router.get("/getConditionPC", async (req, res) => {
  try {
    const result = await getConditionPC();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching ConditionPC:", error);
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
});

router.get("/getConditionCF", async (req, res) => {
  try {
    const result = await getConditionCF();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching ConditionCF:", error);
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
});

router.post("/ConditionPC", async (req, res) => {
  const condition = req.body;

  try {
    const result = await db.query(
      `INSERT INTO ConditionPC (
            natureAmount, mdpiQuartile1, mdpiQuartile2, otherQuartile1, otherQuartile2, otherQuartile3, otherQuartile4)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        condition.natureAmount || null,
        condition.mdpiQuartile1 || null,
        condition.mdpiQuartile2 || null,
        condition.otherQuartile1 || null,
        condition.otherQuartile2 || null,
        condition.otherQuartile3 || null,
        condition.otherQuartile4 || null,
      ]
    );

    console.log("ConditionPC result:", result);
    res
      .status(200)
      .json({ message: "Data inserted successfully", id: result.insertId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error inserting data", error: error.message });
  }
});

router.post("/ConditionCF", async (req, res) => {
  const condition = req.body;

  try {
    const result = await db.query(
      `INSERT INTO ConditionCF (
            maxLeaveinThai, maxLeaveoutThai, workTimeYears, journalYears, qualityScoreSJR, qualityScoreCIF, qualityScoreCORE, expense100ASEAN
            ,expense100Asia, expense100EuropeAmericaAustraliaAfrica, expense50ASEAN, expense50Asia, expense50EuropeAmericaAustraliaAfrica)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        condition.maxLeaveinThai || null,
        condition.maxLeaveoutThai || null,
        condition.workTimeYears || null,
        condition.journalYears || null,
        condition.qualityScoreSJR || null,
        condition.qualityScoreCIF || null,
        condition.qualityScoreCORE || null,
        condition.expense100ASEAN || null,
        condition.expense100Asia || null,
        condition.expense100EuropeAmericaAustraliaAfrica || null,
        condition.expense50ASEAN || null,
        condition.expense50Asia || null,
        condition.expense50EuropeAmericaAustraliaAfrica || null,
      ]
    );

    console.log("ConditionCF result:", result);
    res
      .status(200)
      .json({ message: "Data inserted successfully", id: result.insertId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error inserting data", error: error.message });
    console.error("Error inserting ConditionCF:", error);
  }
});

const scoreStandard = async (typeScore, total, standard, core) => {
  const conditionCF = await getConditionCF();

  const { qualityScoreSJR, qualityScoreCIF } = conditionCF[0];

  let result = "";

  if (standard == "standard" && typeScore == null) {
    return (result = "standard");
  } else {
    if (typeScore == "SJR") {
      if (total >= parseFloat(qualityScoreSJR)) {
        console.log("ค่า SJR อยู่ในเกณฑ์ดีมาก : ", total);
        console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน");

        result = "good";
        return result;
      } else {
        console.log("อยู่ในเกณฑ์มาตรฐาน : ", total);

        result = "standard";
        return result;
      }
    } else if (typeScore == "CIF") {
      if (total >= parseFloat(qualityScoreCIF)) {
        console.log("ค่า CIF อยู่ในเกณฑ์ดีมาก : ", total);
        console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน");

        result = "good";
        return result;
      } else {
        console.log("อยู่ในเกณฑ์มาตรฐาน : ", total);

        result = "standard";
        return result;
      }
    } else if (typeScore == "CORE") {
      if (core == "A" || core == "A*" || core == "A+") {
        console.log("ค่า core อยู่ในเกณฑ์ดีมาก : ", core);
        console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน");

        result = "good";
        return result;
      } else {
        console.log("อยู่ในเกณฑ์มาตรฐาน : ", total);

        result = "standard";
        return result;
      }
    } else {
      console.log("ไม่พบ typeScore ในเงื่อนไข");

      result = "ไม่พบ typeScore ในเงื่อนไข";
      return result;
    }
  }
};

const checkWithdraw = (half_full, withdraw_100, wd_name_100, file_full_100) => {
  let withdraw = "";

  if (half_full == "50%") {
    console.log("withdraw 50%");

    withdraw = "50%";
    return withdraw;
  } else if (half_full == "100%") {
    console.log("withdraw 100%");

    if (
      ["WoS-Q1", "WoS-Q2", "WoS-Q3", "SJR-Q1", "SJR-Q2"].includes(withdraw_100)
    ) {
      if (wd_name_100 != null || wd_name_100 != "") {
        console.log("ชื่อยื่น 100% : ", wd_name_100);

        if (file_full_100 != null || file_full_100 != "") {
          console.log("มีไฟล์แนบ : ", file_full_100);

          withdraw = "100%";
          return withdraw;
        }
      } else {
        console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน การขอรับสนับสนุน 100%");

        withdraw = "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน การขอรับสนับสนุน 100%";
        return withdraw;
      }
    }
  }
};

const getMaxExpense = async (place, In_Out_Country) => {
  const conditionCF = await getConditionCF();

  const {
    expense100ASEAN,
    expense100Asia,
    expense100EuropeAmericaAustraliaAfrica,
  } = conditionCF[0];

  let result = { maxExpense: 0, inThai: "", locat: "" };

  if (In_Out_Country == "abroad") {
    console.log("ณ ต่างประเทศ ประเทศ : ", place);

    for (const category in country) {
      const data = country[category];

      if (Array.isArray(data.countries) && data.countries.includes(place)) {
        if (data.zone == "ASEAN") {
          console.log("zone: ASEAN");

          result.maxExpense = expense100ASEAN;
          result.locat = "Out_Country";

          break;
        } else if (data.zone == "Asia") {
          console.log("zone: Asia");

          result.maxExpense = expense100Asia;
          result.locat = "Out_Country";

          break;
        } else if (data.zone == "Other") {
          console.log("zone: Other");

          result.maxExpense = expense100EuropeAmericaAustraliaAfrica;
          result.locat = "Out_Country";

          break;
        }
      }
    }
  } else if (In_Out_Country == "domestic") {
    console.log("ณ ภายในประเทศ จังหวัด : ", place);

    if (
      ["กรุงเทพ", "นนทบุรี", "สมุทรปราการ", "ปทุมธานี", "ฉะเชิงเทรา"].includes(
        place
      )
    ) {
      console.log("จังหวัดในเขตปริมณฑล");

      result.inThai = "ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้";
      result.locat = "In_Country";
    } else {
      console.log("จังหวัดนอกเขตปริมณฑล");

      result.inThai = "ค่าเบี้ยเลี้ยงเดินทาง <= 300 บาท/คน/วัน";
      result.locat = "In_Country";
    }
  }
  return result;
};

router.get("/confer/calc/:id", async (req, res) => {
    const conditionCF = await getConditionCF();
    const { maxLeaveinThai, maxLeaveoutThai, workTimeYears, journalYears } = conditionCF[0];
    
    const { id } = req.params;
    
    try {
        const confer = await db.query(
            `SELECT * FROM Conference WHERE conf_id = ?`, [id]
        );
        
        const score = await db.query(`SELECT * FROM Score WHERE conf_id = ?`, [id]);
        const file = await db.query(`SELECT * FROM File_pdf WHERE conf_id = ?`, [id]);
        
        const [user] = await db.query(
            `SELECT user_confer, user_year FROM Users WHERE user_id = ?`, [confer[0][0].user_id]
        );

        const Author = confer[0][0].presenter_type;
        const In_Out_Country = confer[0][0].country_conf;
        const In_Out_Scopus = confer[0][0].meeting_type;
        const Leave = confer[0][0].time_of_leave;
        const Sec_Leave = confer[0][0].wos_2_leave;
        const Sec_Leave_name = confer[0][0].name_2_leave;
        const standard = confer[0][0].quality_meeting;
        
        //เรียกจากตาราง officers_opinion_conf
        const year_work = user[0].user_year; // >=3  เป็นพนักงานสถาบันที่ปฏิบัติงานมาแล้วไม่เกิน 3 ปีนับตั้งแต่วันบรรจุและยังไม่เคยลาเข้าร่วมประชุมทางวิชาการ ณ ต่างประเทศ
        const namePlace = confer[0][0].location; // เรียกชื่อประเทศที่ไป

        // check  quality score
        const score_type = score[0][0].score_type;
        const total_score = score[0][0].score_result;
        const core = score[0][0].core_rank;
        
        let result = await scoreStandard(score_type, total_score, standard, core);
        console.log("ค่า result:", result);
        
        // check withdraw
        const half_full = confer[0][0].withdraw;
        const withdraw_100 = confer[0][0].wd_100_quality;
        const wd_name_100 = confer[0][0].wd_name_100;
        const file_full_100 = file[0][0].published_journals;
        
        let withdraw = checkWithdraw(half_full, withdraw_100, wd_name_100, file_full_100);
        console.log("ค่า withdraw:", withdraw);

        // check max expense
        let finalSum = await getMaxExpense(namePlace, In_Out_Country);
        console.log("ค่า max_expense:", finalSum);

        //start logic rule base
        if (Author == "First Author" || Author == "Corresponding Author") {
            console.log(Author);
            
            //ส่วนในประเทศ
            if (In_Out_Country == "domestic") {
                console.log(In_Out_Country);
                
                //ได้รับการสนับสนุนจากคณะ
                if (In_Out_Scopus == "facultyHost") {
                    console.log(In_Out_Scopus);
                    
                    //pull data from getMaxExpense
                    return res.status(200).json({
                        message: "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน",
                        inthai: finalSum.inThai == "ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้" ? "ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้" : "ค่าเบี้ยเลี้ยงเดินทาง <= 300 บาท/คน/วัน",
                        inOutC: finalSum.locat,
                        money: confer[0][0].all_money >= 8000 ? 8000 : confer[0][0].all_money,
                    });
                    
                //เกณฑ์ปกติ
                } else if (In_Out_Scopus == "inScopus") {
                    console.log(In_Out_Scopus);
                    
                    //ระดับไหน => คิดจังหวัด
                    
                    //ลาได้มากสุด 2 ครั้ง
                    if (Leave <= maxLeaveinThai && Leave != 0) {
                        console.log("สมมติว่ามีเรื่องตีพิม ตีพิมพ์เรื่องเต็มใน Proceeding");
                        
                        return res.status(200).json({
                            message: 
                            result == "good" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน",
                            inthai: finalSum.inThai == "ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้" ? "ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้" : "ค่าเบี้ยเลี้ยงเดินทาง <= 300 บาท/คน/วัน",
                            inOutC: finalSum.locat,
                            money:
                            confer[0][0].all_money >= 8000 ? 8000 : confer[0][0].all_money,
                        });
                    } else {
                        console.log("can't go confer");
                        
                        res.status(200).json({
                            message: "ไม่สามารถขอรับการสนับสนุนได้ เนื่องจากไปครบ 2 ครั้งแล้ว",
                        });
                    }
                }
            }
            //ส่วนต่างประเทศ
            else if (In_Out_Country == "abroad") {
                console.log(In_Out_Country);
                
                //ได้รับการสนับสนุนจากคณะ
                if (In_Out_Scopus == "facultyHost") {
                    console.log(In_Out_Scopus);
                    //เข้า loop ดูว่าเบิกได้เท่าไหร่
                    //ถ้าเช้ค 50 100 befor year_work
                    //check เวลาการทำงานและเคยไปประชุมไหม
                    if (year_work >= workTimeYears) {
                        console.log("year_work", year_work);
                        //ไม่เคยไป และทำงานไม่ถึง 3 ปี
                        //เบิก 50 ทันที
                        return res.status(200).json({
                            message: "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน",
                            money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense,
                            inOutC: finalSum.locat
                        });
                    } else {
                        console.log("year_work", year_work);
                        //เคยไป หรือ ทำงานเกิน 3 ปี
                        //ต้องพิจารณาอีกทีว่า 50/ 100
                        return res.status(200).json({
                            message: "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน",
                            money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense,
                            inOutC: finalSum.locat
                        });
                    }
                }
                //เกณฑ์ปกติ
                else if (In_Out_Scopus == "inScopus") {
                    console.log(In_Out_Scopus);
                    
                    //ลาตามเกณฑ์ปกติ
                    if (Leave < maxLeaveoutThai) {
                        console.log("Leave", Leave);
                        
                        //เข้า loop ดูว่าเบิกได้เท่าไหร่
                        //check เวลาการทำงานและเคยไปประชุมไหม
                        if (year_work >= workTimeYears) {
                            console.log("year_work = 0", year_work);
                            //ไม่เคยไป และทำงานไม่ถึง 3 ปี
                            //เบิก 50 ทันที
                            console.log("withdraw", withdraw);
                            return res.status(200).json({
                                message:
                                result == "good" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน",
                                money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense,
                                inOutC: finalSum.locat,
                            });
                        } else {
                            console.log("year_work", year_work);
                            //เคยไป หรือ ทำงานเกิน 3 ปี
                            //ต้องพิจารณาอีกทีว่า 50/ 100
                            return res.status(200).json({
                                message:
                                result == "good" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน",
                                money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense, inOutC: finalSum.locat,
                            });
                        }
                    }
                    //ลาเกินเกณฑ์
                    else if (Leave == maxLeaveoutThai) {
                        console.log("Leave", Leave);

                        //มีบทความขอเพิ่ม
                        if (Sec_Leave == "WoS-Q1" || Sec_Leave == "WoS-Q2") {
                            console.log("Sec_Leave", Sec_Leave);
                            //check ว่าได้แนบชื่อมาด้วย
                            if (Sec_Leave_name != null || Sec_Leave_name != "") {
                                console.log("Sec_Leave_name", Sec_Leave_name);
                                //เข้า loop ดูว่าเบิกได้เท่าไหร่
                                return res.status(200).json({
                                    message: result == "good" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน",
                                    money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense,
                                    inOutC: finalSum.locat,
                                });
                            } else {
                                console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน");
                                res.status(200).json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน" });
                            }
                        }
                        // ไม่มี
                        else {
                            console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน ในการลาครั้งที่ 2");
                            res.status(200).json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน ในการลาครั้งที่ 2" });
                        }
                    }
                }
            }
            res.status(200).json({ message: result });
        } else {
            console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุนเรื่องผู้นำเสนอ หรือผู้วิจัยหลัก");
            res.status(200).json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุนเรื่องผู้นำเสนอ หรือผู้วิจัยหลัก" });
        }
    } catch (err) {
        res.status(500).json({ error789: err.message });
    }
});

router.get("/page_charge/calc/:id", async (req, res) => {
    const conditionPC = await getConditionPC();
    const {
        natureAmount,
        mdpiQuartile1,
        mdpiQuartile2,
        otherQuartile1,
        otherQuartile2,
        otherQuartile3,
        otherQuartile4
    } = conditionPC[0];
    
    const { id } = req.params;

    let withdrawn = 0; //เงินที่เบิกได้
    let quartile = "";

    try {
        const [page_charge] = await db.query("SELECT * FROM Page_Charge WHERE pageC_id = ?", [id]);

        if (!page_charge.length) {
            return res.status(404).json({ message: "page_charge not found" });
        }

        const money_request = page_charge[0].request_support;
        const quality_journal = page_charge[0].quality_journal;
        const journal_name = page_charge[0].journal_name;
        const qt_isi = page_charge[0].qt_isi;
        const qt_sjr = page_charge[0].qt_sjr;
        const qt_scopus = page_charge[0].qt_scopus;

        //check quartile
        if (qt_isi == 1 || qt_sjr == 1 || qt_scopus == 1) {
            quartile = 1;
        } else if (qt_isi == 2 || qt_sjr == 2 || qt_scopus == 2) {
            quartile = 2;
        } else if (qt_isi == 3 || qt_sjr == 3 || qt_scopus == 3) {
            quartile = 3;
        } else if (qt_isi == 4 || qt_sjr == 4 || qt_scopus == 4) {
            quartile = 4;
        }

        console.log("Get page_charge: ", page_charge[0]);

        for (let i = 0; i < quality_journal.length; i++) {
            console.log("checking journal", quality_journal[i]);

            if (quality_journal[i] === "nature") {
                console.log("Journal is 'nature'");

                withdrawn = money_request < natureAmount ? money_request : natureAmount;
                break;
            } else {
                const keyword = ["mdpi", "frontiers", "hindawi"];

                const filterword = journal_name.split(" ").filter((word) => word.includes(keyword));

                if (filterword.length > 0) {
                    console.log("have filterword: ", filterword);
                    console.log(quartile);

                    if (quartile == 1) {
                        withdrawn = money_request < mdpiQuartile1 ? money_request : mdpiQuartile1;
                        break;
                    } else if (quartile == 2) {
                        withdrawn = money_request >= mdpiQuartile2 ? mdpiQuartile2 : money_request;
                        break;
                    }
                } else {
                    console.log("don't have filterword");
                    if (quartile == 1) {
                        withdrawn = money_request >= otherQuartile1 ? otherQuartile1 : money_request;
                        break;
                    } else if (quartile == 2) {
                        withdrawn = money_request >= otherQuartile2 ? otherQuartile2 : money_request;
                        break;
                    } else if (quartile == 3) {
                        withdrawn = money_request < otherQuartile3 ? money_request : otherQuartile3;
                        break;
                    } else if (quartile == 4) {
                        withdrawn = money_request < otherQuartile4 ? money_request : otherQuartile4;
                        break;
                    }
                }
            }
        }
        console.log("Final withdrawn:", withdrawn);
        res.status(200).json({ ...page_charge[0], withdrawn });
    }catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    }
});

exports.router = router;
