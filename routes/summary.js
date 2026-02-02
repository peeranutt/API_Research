const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.get("/all_summary_conference/:year", async (req, res) => {
  const { year } = req.params
  try {
    const [Summary] = await db.query(
    `SELECT
      u.user_nameth,
      c.conf_research,
      c.conf_name,
      c.name_co_researchers,
      c.course_co_researchers,
      c.location,
      c.meeting_type,
      c.quality_meeting,
      c.time_of_leave,
      c.trav_dateStart,
      c.trav_dateEnd,
      f.form_status,
      b.withdraw,
      COALESCE(c.total_amount, 0) AS total_amount,
      COALESCE(c.inter_expenses, 0) AS inter_expenses,
      COALESCE(c.total_room, 0) AS total_room,
      COALESCE(c.total_allowance, 0) AS total_allowance,
      COALESCE(c.domestic_expenses, 0) + COALESCE(c.overseas_expenses, 0) + COALESCE(c.airplane_tax, 0) AS total_other, 
      COALESCE(c.all_money, 0) AS all_money,
      COALESCE(b.amount_approval, 0) AS amount_approval
      FROM Conference c
      JOIN Users u ON c.user_id = u.user_id
      LEFT JOIN Form f ON c.conf_id = f.conf_id
      LEFT JOIN Budget b ON f.form_id = b.form_id
      WHERE f.form_status = "approve"
      AND b.budget_year = ?;`, [year]
    );
    
    console.log("Summary confer", Summary)
    
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all_summary_page_charge/:year", async (req, res) => {
  const { year } = req.params
  try {
    const [Summary] = await db.query(
    `SELECT
      p.pageC_id,
      u.user_nameth,
      p.name_co_researchers,
      p.course_co_researchers,
      p.article_title,
      p.journal_name,
      p.quality_journal,
      p.qt_isi,
      p.qt_sjr,
      p.qt_scopus,
      p.month,
      p.year,
      p.date_review_announce,
      f.form_status,
      b.withdraw,
      b.budget_year
      FROM Page_Charge p
      JOIN Users u ON p.user_id = u.user_id
      LEFT JOIN Form f ON p.pageC_id = f.pageC_id
      LEFT JOIN Budget b ON f.form_id = b.form_id
      WHERE f.form_status = "approve"
      AND b.budget_year = ?;`, [year]
    );

    console.log("Summary pc", Summary);
    res.status(200).json([Summary]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all_summary_kris", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
        k.kris_id,
        u.user_nameth,
        k.name_research_th,
        k.research_cluster,
        k.res_cluster_other,
        k.res_standard,
        k.res_standard_trade,
        k.year,
        k.project_periodStart,
        k.project_periodEnd,
        f.form_status
        FROM Research_KRIS k
        JOIN Users u ON k.user_id = u.user_id
        LEFT JOIN Form f ON k.kris_id = f.kris_id
        WHERE f.form_status = "approve";`
    );
    console.log("Summary krid", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/remainingConference/:year", async (req, res) => {
  const { year } = req.params
  console.log("year", year)
  try {
   const [Summary] = await db.query(
  `SELECT
    SUM(b.withdraw) AS total_withdraw,
    b.budget_year,
    b.Conference_amount,
    b.total_remaining_credit_limit,
    f.form_type
  FROM Budget b
  JOIN Form f ON b.form_id = f.form_id
  WHERE f.form_status = "approve"
    AND f.form_type = "Conference"
    AND b.budget_year = ?
  GROUP BY b.budget_year, b.Conference_amount, b.total_remaining_credit_limit, f.form_type
  LIMIT 1;`,
  [year]
);


    console.log("remainingConference", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/remainingPc/:year", async (req, res) => {
  const { year } = req.params
  try {
    const [Summary] = await db.query(
      `SELECT
       SUM(b.withdraw) AS total_withdraw,
       b.budget_year,
        b.Page_Charge_amount,
        b.total_remaining_credit_limit,
        f.form_type
        FROM Budget b
        JOIN Form f ON b.form_id = f.form_id
        WHERE f.form_status = "approve"
          AND f.form_type = "Page_Charge"
          AND b.budget_year = ?
        GROUP BY b.budget_year, b.Page_Charge_amount, b.total_remaining_credit_limit, f.form_type
        LIMIT 1;`, [year]
    );
    console.log("remainingPc", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count/:year", async (req, res) => {
  const { year } = req.params
  try {
    const [Summary] = await db.query(
      `SELECT f.form_type, COUNT(*) AS total_count
        FROM Form f
        JOIN Budget b ON f.form_id = b.form_id
        WHERE f.form_status = 'approve'
          AND f.form_type IN ('Conference', 'Page_Charge', 'Research_KRIS')
          AND b.budget_year = ?
        GROUP BY f.form_type;`, [year]
    );
    console.log("count", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count_confer_withdraw/:year", async (req, res) => {
  const { year } = req.params
  try {
    const [Summary] = await db.query(
      `SELECT
        c.withdraw,
        COUNT(c.conf_id) AS total_withdraws,
        SUM(COALESCE(c.total_amount, 0)) AS total_registration,
        SUM(
          COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) +
          COALESCE(c.airplane_tax, 0)
        ) AS total_other,
        SUM(COALESCE(c.inter_expenses, 0)) AS total_ticket,  -- Fixed here
        SUM(COALESCE(c.total_room, 0)) AS total_room,
        SUM(COALESCE(c.total_allowance, 0)) AS total_allowance,
        SUM(
          COALESCE(c.total_amount, 0) +
          COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) +
          COALESCE(c.airplane_tax, 0) +
          COALESCE(c.inter_expenses, 0) +
          COALESCE(c.total_room, 0) +
          COALESCE(c.total_allowance, 0)
        ) AS all_total
        FROM Conference c
        JOIN Form f ON c.conf_id = f.conf_id
        LEFT JOIN Budget b ON f.form_id = b.form_id
        WHERE f.form_status = 'approve'
        AND c.country_conf = 'abroad'
        AND b.budget_year = ?
        GROUP BY c.withdraw
        ORDER BY c.withdraw;`, [year]
    );
    console.log("count_confer_withdraw", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count_confer_country/:year", async (req, res) => {
  const { year } = req.params
  try {
    const [Summary] = await db.query(
      `SELECT c.location, c.withdraw, c.country_conf,
        SUM(COALESCE(c.total_amount, 0)) AS total_registration,
        SUM(
          COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) +
          COALESCE(c.airplane_tax, 0)) AS total_other,
        SUM(COALESCE(c.inter_expenses, 0)) AS total_ticket,
        SUM(COALESCE(c.total_room, 0)) AS total_room,
        SUM(COALESCE(c.total_allowance, 0)) AS total_allowance,
        SUM(
          COALESCE(c.total_amount, 0) + COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) + COALESCE(c.airplane_tax, 0) +
          COALESCE(c.inter_expenses, 0) + COALESCE(c.total_room, 0) +
          COALESCE(c.total_allowance, 0)) AS all_total,
        SUM(COALESCE(b.amount_approval, 0)) AS total_amount_approval,
        COUNT(*) AS total_count,
      
        CASE 
          WHEN c.country_conf = "abroad" THEN 
              CASE 
                  WHEN c.location IN ('ลาว', 'กัมพูชา', 'อินโดนีเซีย', 'เมียนมาร์', 'มาเลเซีย', 'เวียดนาม', 'ฟิลิปปินส์') THEN 'SEA'
                  WHEN c.location IN ('บรูไน', 'สิงคโปร์', 'ญี่ปุ่น', 'เกาหลีใต้', 'ไต้หวัน', 'จีน', 'ฮ่องกง', 'อินเดีย', 'ศรีลังกา', 'ปากีสถาน', 'บังกลาเทศ', 'เนปาล', 'ภูฏาน', 'มัลดีฟส์', 'มองโกเลีย', 'คาซัคสถาน', 'อุซเบกิสถาน', 'เติร์กเมนิสถาน', 'คีร์กีซสถาน', 'ทาจิกิสถาน') THEN 'ASIA'
                  ELSE 'EUA'
              END
          ELSE 'ในประเทศ'
        END AS region_category
      
        FROM Conference c
        JOIN Form f ON c.conf_id = f.conf_id
        LEFT JOIN Budget b ON f.form_id = b.form_id
        WHERE f.form_status = "approve"
        AND b.budget_year = ?
        GROUP BY region_category, c.location, c.withdraw, c.country_conf
        ORDER BY region_category ASC, c.location ASC;`, [year]
    );

    // จัดกลุ่มข้อมูลตาม region_category
    const groupedSummary = Summary.reduce((acc, row) => {
      const { region_category, ...data } = row;

      if (!acc[region_category]) {
        acc[region_category] = { count: 0, data: [] };
      }

      acc[region_category].count += 1;
      acc[region_category].data.push(data);

      return acc;
    }, {});
    console.log("count_confer_country", Summary)
    res.status(200).json(groupedSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count_confer_thai/:year", async (req, res) => {
  const { year } = req.params
  console.log("y in count cf ct", year)
  try {
    const [Summary] = await db.query(
      `SELECT c.location, c.country_conf,
      SUM(COALESCE(c.total_amount, 0)) AS total_registration,
      SUM(
          COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) +
          COALESCE(c.airplane_tax, 0)
      ) AS total_other,
      SUM(COALESCE(c.inter_expenses, 0)) AS total_ticket,
      SUM(COALESCE(c.total_room, 0)) AS total_room,
      SUM(COALESCE(c.total_allowance, 0)) AS total_allowance,
      SUM(
          COALESCE(c.total_amount, 0) + COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) + COALESCE(c.airplane_tax, 0) +
          COALESCE(c.inter_expenses, 0) + COALESCE(c.total_room, 0) +
          COALESCE(c.total_allowance, 0)
      ) AS all_total,
      SUM(COALESCE(b.amount_approval, 0)) AS total_amount_approval,
      COUNT(*) AS total_count

    FROM Conference c
    JOIN Form f ON c.conf_id = f.conf_id
    LEFT JOIN Budget b ON f.form_id = b.form_id
    WHERE f.form_status = "approve" and c.country_conf = "domestic"
    AND b.budget_year = ?
    GROUP BY c.location, c.country_conf
    ORDER BY c.location ASC;
`, [year]
    );
console.log("count_confer_thai", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/eachyears", async (req, res) => {
  const [Summary] = await db.query(
    `SELECT 
    b.budget_year,
     SUM(b.withdraw) AS total_withdraw,
    SUM(CASE WHEN f.form_type = 'Conference' THEN 1 ELSE 0 END) AS total_conferences,
    SUM(CASE WHEN f.form_type = 'Page_Charge' THEN 1 ELSE 0 END) AS total_pagecharge,
    SUM(CASE WHEN f.form_type = 'Conference' THEN b.withdraw ELSE 0 END) AS total_withdraw_conference,
    SUM(CASE WHEN f.form_type = 'Page_Charge' THEN b.withdraw ELSE 0 END) AS total_withdraw_pagecharge
    FROM Budget b
LEFT JOIN Form f ON b.form_id = f.form_id
WHERE b.budget_year >= (YEAR(CURRENT_DATE) - 3) 
AND f.form_status = "approve"
GROUP BY b.budget_year
ORDER BY b.budget_year DESC;
`
  );
console.log("eachyears", Summary)
  res.status(200).json(Summary);
});

router.get("/all_sum", async (req, res) => {
  const [rows] = await db.query(`
    SELECT
  y.budget_year,
  t.form_type,
  IFNULL(COUNT(b.budget_id), 0) AS total_forms_approved,
  IFNULL(COUNT(DISTINCT b.user_id), 0) AS total_users_approved,
  IFNULL(FORMAT(SUM(b.amount_approval), 2), '0.00') AS total_amount_approved
FROM
  (SELECT DISTINCT budget_year FROM Budget) AS y
  CROSS JOIN
  (SELECT DISTINCT form_type FROM Form) AS t
  LEFT JOIN (
    SELECT * FROM Form WHERE form_status = 'approve'
  ) AS f ON f.form_type = t.form_type
  LEFT JOIN Budget b ON b.form_id = f.form_id AND b.budget_year = y.budget_year
GROUP BY
  y.budget_year,
  t.form_type
ORDER BY
  y.budget_year, t.form_type;
  `);

  const allFormTypes = ["Conference", "Page_Charge"]; // ฟอร์มที่ต้องมีเสมอ

  const grouped = rows.reduce((acc, row) => {
    const year = row.budget_year;
    if (!acc[year]) {
      acc[year] = {
        budget_year: year,
        forms: [],
      };
    }

    acc[year].forms.push({
      form_type: row.form_type,
      total_forms_approved: Number(row.total_forms_approved),
      total_users_approved: Number(row.total_users_approved),
      total_amount_approved: row.total_amount_approved,
    });

    return acc;
  }, {});

  // 🔧 เติม form_type ที่ขาด
  Object.values(grouped).forEach((group) => {
    const existingTypes = group.forms.map((f) => f.form_type);
    allFormTypes.forEach((type) => {
      if (!existingTypes.includes(type)) {
        group.forms.push({
          form_type: type,
          total_forms_approved: 0,
          total_users_approved: 0,
          total_amount_approved: "0.00",
        });
      }
    });

    // จัดเรียง form_type
    group.forms.sort(
      (a, b) =>
        allFormTypes.indexOf(a.form_type) - allFormTypes.indexOf(b.form_type)
    );
  });

  const finalResult = Object.values(grouped);
  
  console.log("all_sum", finalResult);
  res.status(200).json(finalResult);
});

exports.router = router;
