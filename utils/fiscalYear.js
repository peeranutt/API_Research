/**
 * คืนค่าปีงบประมาณไทยปัจจุบัน
 */
const getCurrentThaiFiscalYear = () => {
  const now = new Date();
  const thaiYear = now.getFullYear() + 543;
  return now.getMonth() + 1 >= 10 ? thaiYear + 1 : thaiYear;
};

/**
 * แปลง project_periodStart (string) เป็นปีงบประมาณไทย
 * รองรับ format "DD/MM/YYYY" และ "YYYY-MM-DD"
 */
const fiscalYearFromDate = (dateStr) => {
  let day, month, thaiYear;

  if (dateStr.includes("/")) {
    [day, month, thaiYear] = dateStr.split("/").map(Number);
  } else {
    const [year, m, d] = dateStr.split("-").map(Number);
    thaiYear = year + 543;
    month = m;
    day = d;
  }

  return month >= 10 ? thaiYear + 1 : thaiYear;
};

/**
 * SQL CASE expression สำหรับคำนวณปีงบประมาณจาก budget_year หรือ doc_submit_date
 * ใช้ใน FROM/WHERE ที่มี alias b (Budget), c (Conference), p (Page_Charge), k (Research_KRIS)
 */
const FISCAL_YEAR_EXPR = `
  CASE
    WHEN b.budget_year IS NOT NULL THEN b.budget_year
    WHEN MONTH(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) >= 10
      THEN YEAR(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) + 544
    ELSE
      YEAR(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) + 543
  END
`;

/**
 * STATUS_GROUPS สำหรับ filter status "รออนุมัติ"
 */
const STATUS_GROUPS = {
  waitingApproval: [
    "hr", "research", "finance", "pending",
    "associate", "dean", "attendMeeting", "waitingApproval",
  ],
};

/**
 * Build WHERE conditions + params สำหรับ filter typeStatus
 * @returns {{ conditions: string[], params: any[] }}
 */
const buildStatusFilter = (typeStatus) => {
  const conditions = [];
  const params = [];

  if (!typeStatus || typeStatus === "all") return { conditions, params };

  if (STATUS_GROUPS[typeStatus]) {
    const group = STATUS_GROUPS[typeStatus];
    conditions.push(`f.form_status IN (${group.map(() => "?").join(",")})`);
    params.push(...group);
    return { conditions, params };
  }

  const statuses = typeStatus.split(",").map((s) => s.trim());
  const isReturning = statuses.includes("return");
  const normalStatuses = statuses.filter((s) => s !== "return");

  if (normalStatuses.length) {
    conditions.push(`f.form_status IN (${normalStatuses.map(() => "?").join(",")})`);
    params.push(...normalStatuses);
  }

  if (isReturning) {
    const roleToMatch = normalStatuses[0] === "pending" ? "finance" : normalStatuses[0];
    conditions.push(`(f.form_status = 'return' AND f.return_to = ?)`);
    params.push(roleToMatch);
  }

  return { conditions, params };
};

module.exports = { getCurrentThaiFiscalYear, fiscalYearFromDate, FISCAL_YEAR_EXPR, STATUS_GROUPS, buildStatusFilter };
