/**
 * getRecipientEmail
 * ใช้ร่วมกันใน Budget, Officers_opinion_conf, Officers_opinion_pc
 *
 * @param {object} connection  - db connection
 * @param {object} data        - { form_status, return_to }
 * @param {string} formId      - form_id
 * @param {object} [opts]      - { confId, pageC_id } สำหรับ return → professor
 * @returns {Promise<string>}  - email address
 */
const getRecipientEmail = async (connection, data, formId, opts = {}) => {
  const { form_status, return_to } = data;

  // approve / notApproved → หา professor จาก form_type
  if (form_status === "approve" || form_status === "notApproved") {
    const [[row]] = await connection.query(
      `SELECT u.user_email
       FROM Form f
       LEFT JOIN Page_Charge pc ON f.pageC_id = pc.pageC_id
       LEFT JOIN Conference c   ON f.conf_id = c.conf_id
       LEFT JOIN Research_KRIS rk ON f.kris_id = rk.kris_id
       JOIN Users u ON u.user_id = COALESCE(pc.user_id, c.user_id, rk.user_id)
       WHERE f.form_id = ?`,
      [formId],
    );
    return row.user_email;
  }

  // return → professor
  if (form_status === "return" && return_to === "professor") {
    const [[row]] = await connection.query(
      `SELECT u.user_email
       FROM Form f
       LEFT JOIN Page_Charge pc ON f.pageC_id = pc.pageC_id
       LEFT JOIN Conference c   ON f.conf_id = c.conf_id
       LEFT JOIN Research_KRIS rk ON f.kris_id = rk.kris_id
       JOIN Users u ON u.user_id = COALESCE(pc.user_id, c.user_id, rk.user_id)
       WHERE f.form_id = ?`,
      [formId],
    );
    return row.user_email;
  }

  // return → officer อื่น
  if (form_status === "return") {
    const [[row]] = await connection.query(
      `SELECT u.user_email
       FROM Form f
       JOIN Users u ON f.return_to = u.user_role
       WHERE f.form_id = ?`,
      [formId],
    );
    return row.user_email;
  }

  // default → next officer ตาม form_status
  const [[row]] = await connection.query(
    `SELECT u.user_email
     FROM Form f
     JOIN Users u ON f.form_status = u.user_role
     WHERE f.form_id = ?`,
    [formId],
  );
  return row.user_email;
};

module.exports = { getRecipientEmail };
