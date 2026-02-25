USE ResearchAdministration;
-- Set consistent collation for database
ALTER DATABASE researchadministration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ปิดการตรวจสอบ Foreign Key ก่อน
SET FOREIGN_KEY_CHECKS = 0;

-- ลบตารางตามลำดับที่เหมาะสม
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Budget;
DROP TABLE IF EXISTS officers_opinion_kris;
DROP TABLE IF EXISTS officers_opinion_conf;
DROP TABLE IF EXISTS officers_opinion_pc;
DROP TABLE IF EXISTS File_pdf;
DROP TABLE IF EXISTS Form;
DROP TABLE IF EXISTS Research_KRIS;
DROP TABLE IF EXISTS Page_Charge;
DROP TABLE IF EXISTS Score;
DROP TABLE IF EXISTS Conference;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS ConditionPC;
DROP TABLE IF EXISTS ConditionCF;

-- เปิดการตรวจสอบ Foreign Key กลับมา
SET FOREIGN_KEY_CHECKS = 1;

-- สร้างตาราง Users CHECK
CREATE TABLE Users (
	user_id INT PRIMARY KEY UNIQUE  AUTO_INCREMENT,
	user_role ENUM('professor', 'admin', 'hr', 'research', 'finance', 'associate', 'dean') NOT NULL,
	user_nameth VARCHAR(100) NOT NULL,
	user_nameeng VARCHAR(100) NOT NULL,
	user_email VARCHAR(100) NOT NULL,
	user_signature VARCHAR(50),
	user_moneyPC DECIMAL(10,2),
    user_moneyCF DECIMAL(10,2),
	user_positionth VARCHAR(50),
    user_positioneng VARCHAR(50),
    user_startwork DATE NOT NULL,
    user_year INT NOT NULL,
    user_confer boolean NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ตารางเอกสารขออนุมัติค่าเดินทาง (Conference) CHECK
CREATE TABLE Conference (
    conf_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    user_id INT NOT NULL,
    conf_times VARCHAR(10) NOT NULL,
    conf_days DATE NOT NULL,
    trav_dateStart DATE NOT NULL,
    trav_dateEnd DATE NOT NULL,
    conf_research VARCHAR(255) NOT NULL,
    num_co_researchers INT,
    name_co_researchers JSON,
    course_co_researchers JSON,
    conf_name VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_venue VARCHAR(255) NOT NULL,
    date_submit_organizer DATE NOT NULL,
    argument_date_review DATE NOT NULL,
    last_day_register DATE NOT NULL,
    meeting_type ENUM('facultyHost', 'inScopus') NOT NULL,
    quality_meeting ENUM('standard', 'good', ''),
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    time_of_leave ENUM('1', '2'),
    location VARCHAR(50) NOT NULL,
    wos_2_leave ENUM('WoS-Q1', 'WoS-Q2'),
    name_2_leave VARCHAR(255),
    withdraw ENUM('50%', '100%'),
    wd_100_quality ENUM('WoS-Q1', 'WoS-Q2', 'WoS-Q3', 'SJR-Q1', 'SJR-Q2'),
    wd_name_100 VARCHAR(255),
    country_conf ENUM('abroad', 'domestic') NOT NULL,
    num_register_articles DECIMAL(10,2) NOT NULL,
	regist_amount_1_article DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    domestic_expenses DECIMAL(10,2),
    overseas_expenses DECIMAL(10,2),
    travel_country VARCHAR(255),
    inter_expenses DECIMAL(10,2),
    airplane_tax DECIMAL(10,2),
    num_days_room DECIMAL(10,2),
    room_cost_per_night DECIMAL(10,2),
    total_room DECIMAL(10,2),
    num_travel_days DECIMAL(10,2),
    daily_allowance DECIMAL(10,2),
    total_allowance DECIMAL(10,2),
    all_money DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
ALTER TABLE Conference CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ตารางคำนวณคะแนนคุณภาพการประชุมวิชาการ (Score) CHECK
CREATE TABLE Score (
    sc_id INT PRIMARY KEY AUTO_INCREMENT,
    conf_id INT NOT NULL UNIQUE,
    score_type ENUM('SJR', 'CIF', 'CORE'),
    sjr_score DECIMAL(10,2),
    sjr_year INT,
    hindex_score DECIMAL(10,2),
    hindex_year INT,
    Citation DECIMAL(10,2),
    score_result DECIMAL(10,2),
    core_rank VARCHAR(10),
    FOREIGN KEY (conf_id) REFERENCES Conference(conf_id)
);
-- ตารางเอกสารขออนุมัติค่า Page Charge (Page_Charge) CHECK
CREATE TABLE Page_Charge (
    pageC_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pageC_times VARCHAR(10) NOT NULL,
    pageC_days DATE NOT NULL,
    journal_name VARCHAR(255) NOT NULL,
    quality_journal JSON NOT NULL,
    pc_isi_year INT,
    pc_sjr_year INT,
    pc_scopus_year INT,
    impact_factor DECIMAL(10,2),
    sjr_score DECIMAL(10,2),
    cite_score DECIMAL(10,2),
    qt_isi INT,
    qt_sjr INT,
    qt_scopus INT,
    support_limit INT NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    num_co_researchers INT,
    name_co_researchers JSON,
    course_co_researchers JSON,
    vol_journal INT,
    issue_journal INT,
    month VARCHAR(20),
    year INT,
    ISSN_ISBN VARCHAR(50),
    submission_date DATE NOT NULL,
	date_review_announce DATE NOT NULL,
    final_date DATE NOT NULL,
    article_research_ject VARCHAR(255),
    research_type ENUM('basic', 'applied', 'research&development', 'other' ),
    research_type2 VARCHAR(100),
    name_funding_source VARCHAR(255),
    budget_limit DECIMAL(10,2),
    annual INT,
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    request_support DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
ALTER TABLE Page_Charge CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table for Research_KRIS CHECK
CREATE TABLE Research_KRIS (
	kris_id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	name_research_th VARCHAR(255) NOT NULL,
	name_research_en VARCHAR(255) NOT NULL,
	research_cluster JSON NOT NULL,
	res_cluster_other VARCHAR(100),
	res_standard JSON NOT NULL,
	res_standard_trade ENUM('52', '53'),
	h_index DECIMAL(10,2) NOT NULL,
	his_invention Varchar (255) NOT NULL,
	participation_percent DECIMAL(10,2) NOT NULL,
	year INT NOT NULL,
	project_periodStart Date NOT NULL,
	project_periodEnd Date NOT NULL,
	doc_submit_date DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
ALTER TABLE Research_KRIS MODIFY COLUMN research_cluster JSON;
ALTER TABLE Research_KRIS MODIFY COLUMN res_standard JSON;
ALTER TABLE Research_KRIS MODIFY COLUMN res_standard_trade JSON;

-- สร้างตาราง Form CHECK
CREATE TABLE Form (
	form_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	form_type ENUM('Conference', 'Page_Charge', 'Research_KRIS') NOT NULL,
	conf_id INT UNIQUE,
	pageC_id INT UNIQUE,
	kris_id INT UNIQUE,
	form_status ENUM('hr', 'research', 'finance', 'pending', 'associate', 'dean','waitingApproval', 'approve', 'notApproved', 'attendMeeting', 'return') NOT NULL,
    comment_pending VARCHAR(100),
    edit_data JSON,
    date_form_edit DATE DEFAULT (CURRENT_DATE),
    editor VARCHAR(100),
    professor_reedit boolean,
    return_to ENUM('professor', 'hr', 'research', 'finance', 'associate', 'dean'),
    return_note VARCHAR(255),
    past_return ENUM('professor', 'hr', 'research', 'finance', 'associate', 'dean'),

	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id),
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
ALTER TABLE Form CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ตารางเก็บเอกสาร PDF (File_pdf) CHECK
CREATE TABLE File_pdf (
	file_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	type ENUM ('Conference', 'Page_Charge','Research_KRIS') NOT NULL,
	conf_id INT UNIQUE,
	pageC_id INT UNIQUE,
	kris_id INT UNIQUE,
	kris_file VARCHAR(255),
	full_page VARCHAR(255), -- confer
	date_published_journals VARCHAR(255),
	published_journals VARCHAR(255),
	q_proof VARCHAR(255),
	call_for_paper VARCHAR(255),
	fee_receipt VARCHAR(255),
	fx_rate_document VARCHAR(255),
	conf_proof VARCHAR(255),
	pc_proof VARCHAR(255), -- pc
	q_pc_proof VARCHAR(255),
	invoice_public VARCHAR(255),
	accepted VARCHAR(255), -- confer && pc
	copy_article VARCHAR(255),
    upload_article VARCHAR(255),
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id),
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
-- Table for officer's_opinion_pc CHECK
CREATE TABLE officers_opinion_pc (
	p_office_id INT AUTO_INCREMENT PRIMARY KEY,
    research_id INT,
    associate_id INT,
    dean_id INT,
    pageC_id INT NOT NULL UNIQUE,
    p_research_result ENUM('approve', 'notApproved', 'return_professor'),
    p_research_reason VARCHAR(255),
    p_associate_result ENUM('approve', 'notApproved', 'return'),
    p_associate_reason VARCHAR(255),
    p_dean_acknowledge ENUM('acknowledge', 'notAcknowledge'),
    p_dean_result ENUM('approve', 'notApproved', 'return'),
    p_dean_reason VARCHAR(255),
    research_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    associate_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    dean_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (research_id) REFERENCES Users(user_id),
    FOREIGN KEY (associate_id) REFERENCES Users(user_id),
    FOREIGN KEY (dean_id) REFERENCES Users(user_id),
    FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id)
);
ALTER TABLE officers_opinion_pc CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table: officer's_opinion_conf CHECK
CREATE TABLE officers_opinion_conf (
	c_office_id INT PRIMARY KEY AUTO_INCREMENT,
    hr_id INT,
    research_id INT,
    associate_id INT,
    dean_id INT,
	conf_id INT NOT NULL UNIQUE,
	c_hr_result ENUM('approve', 'notApproved', 'return_professor'),
	c_hr_reason VARCHAR(255),
    c_hr_note VARCHAR(255),
    c_quality ENUM('good', 'standard'),
    c_comment_quality VARCHAR(255),
    c_comment_quality_good VARCHAR(255),
	c_research_result ENUM('approve', 'notApproved', 'return'),
	c_research_reason VARCHAR(255),
	c_associate_result ENUM('approve', 'notApproved', 'return'),
    c_associate_reason VARCHAR(255),
	c_dean_result ENUM('approve', 'notApproved', 'return'),
    c_dean_reason VARCHAR(255),
    hr_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    research_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    associate_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    dean_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (hr_id) REFERENCES Users(user_id),
    FOREIGN KEY (research_id) REFERENCES Users(user_id),
    FOREIGN KEY (associate_id) REFERENCES Users(user_id),
    FOREIGN KEY (dean_id) REFERENCES Users(user_id),
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id)
);
ALTER TABLE officers_opinion_conf CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table: officer's_opinion_kris CHECK
CREATE TABLE officers_opinion_kris (
	k_office_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
	kris_id INT NOT NULL UNIQUE,
	research_admin ENUM('acknowledge', 'notAcknowledge'),
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
ALTER TABLE officers_opinion_kris CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table: Budget CHECK
CREATE TABLE Budget (
	budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
	form_id INT NOT NULL UNIQUE,
	budget_year INT NOT NULL,
    Research_kris_amount DECIMAL(10,2),
	Page_Charge_amount DECIMAL(10,2),
    Conference_amount DECIMAL(10,2),
	num_expenses_approved INT NOT NULL,
	total_amount_approved DECIMAL(10,2) NOT NULL,
	remaining_credit_limit DECIMAL(10,2) NOT NULL,
	amount_approval DECIMAL(10,2) NOT NULL,
	total_remaining_credit_limit DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE,
    travelExpenses DECIMAL(10,2),
    allowance DECIMAL(10,2),
    withdraw DECIMAL(10,2),
	FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (form_id) REFERENCES Form(form_id)
);
CREATE TABLE Notification (
	noti_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    form_id INT UNIQUE NOT NULL,
    name_form VARCHAR(255) NOT NULL,
    date_update DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (form_id) REFERENCES Form(form_id)
);
CREATE TABLE ConditionPC (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    natureAmount DECIMAL(10,2),
    mdpiQuartile1 DECIMAL(10,2),
    mdpiQuartile2 DECIMAL(10,2),
    otherQuartile1 DECIMAL(10,2),
    otherQuartile2 DECIMAL(10,2),
    otherQuartile3 DECIMAL(10,2),
    otherQuartile4 DECIMAL(10,2),
    date_update DATE DEFAULT (CURRENT_DATE)
);
CREATE TABLE ConditionCF (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    maxLeaveinThai DECIMAL(10,2),
    maxLeaveoutThai DECIMAL(10,2),
    workTimeYears DECIMAL(10,2),
    journalYears DECIMAL(10,2),
    qualityScoreSJR DECIMAL(10,2),
    qualityScoreCIF DECIMAL(10,2),
    qualityScoreCORE VARCHAR(10),
    expense100ASEAN DECIMAL(10,2),
    expense100Asia DECIMAL(10,2),
    expense100EuropeAmericaAustraliaAfrica DECIMAL(10,2),
    expense50ASEAN DECIMAL(10,2),
    expense50Asia DECIMAL(10,2),
    expense50EuropeAmericaAustraliaAfrica DECIMAL(10,2),
    date_update DATE DEFAULT (CURRENT_DATE)
);

INSERT INTO Users (
    user_role, user_nameth, user_nameeng, user_email, user_signature,user_moneyPC,
    user_moneyCF, user_positionth, user_positioneng, user_startwork, user_year, user_confer
) VALUES
('professor', 'โอฬาร วงศ์วิรัตน์', 'Olarn Wongwirat', 'olarn@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1998-09-06', TIMESTAMPDIFF(YEAR, '1998-09-06', CURRENT_DATE), true),
('professor', 'นพพร โชติกกำธร', 'Nopporn Chotikakamthorn', 'nopporn@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-03-19', TIMESTAMPDIFF(YEAR, '1996-03-19', CURRENT_DATE), true),
('professor', 'อัครินทร์ คุณกิตติ', 'Akharin Khunkitti', 'akharin@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.', 'Asst. Prof.', '1989-03-01', TIMESTAMPDIFF(YEAR, '1989-03-01', CURRENT_DATE), true),
('dean', 'วรพจน์ กรีสุระเดช', 'Worapoj Kreesuradej', 'worapoj@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1997-01-30', TIMESTAMPDIFF(YEAR, '1997-01-30', CURRENT_DATE), true),
('professor', 'อาริต  ธรรมโน', 'Arit Thammano', 'arit@it.kmitl.ac.th', NULL, 0, 80000, 'ศ.ดร.', 'Prof. Dr.', '1998-10-01', TIMESTAMPDIFF(YEAR, '1998-10-01', CURRENT_DATE), true),
('professor', 'โชติพัชร์ ภรณวลัย', 'Chotipat Pornavalai', 'chotipat@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1999-01-20', TIMESTAMPDIFF(YEAR, '1999-01-20', CURRENT_DATE), true),
('professor', 'ภัทรชัย ลลิตโรจน์วงศ์', 'Pattarachai Lalitrojwong', 'pattarachai@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1999-07-01', TIMESTAMPDIFF(YEAR, '1999-07-01', CURRENT_DATE), true),
('professor', 'วารุนี  บัววิรัตน์', 'Warune Buavirat', 'warune@it.kmitl.ac.th', NULL, 0, 80000, 'อาจารย์', 'Mrs.', '2001-11-01', TIMESTAMPDIFF(YEAR, '2001-11-01', CURRENT_DATE), true),
('professor', 'พรฤดี  เนติโสภากุล', 'Ponrudee Netisopakul', 'ponrudee@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2002-08-01', TIMESTAMPDIFF(YEAR, '2002-08-01', CURRENT_DATE), true),
('professor', 'พัฒนพงษ์  ฉันทมิตรโอภาส', 'Pattanapong Chantamit-O-Pas', 'pattanapong@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-08-01', TIMESTAMPDIFF(YEAR, '2003-08-01', CURRENT_DATE), true),
('professor', 'สุเมธ  ประภาวัต', 'Sumet Prabhavat', 'sumet@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE), true),
('professor', 'อนันตพัฒน์  อนันตชัย', 'Anuntapat Anuntachai', 'anuntapat@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE), true),
('professor', 'บุญประเสริฐ  สุรักษ์รัตนสกุล', 'Boonprasert Surakratanasakul', 'boonprasert@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE), true),
('professor', 'ลภัส  ประดิษฐ์ทัศนีย์', 'Lapas Pradittasnee', 'lapas@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-16', TIMESTAMPDIFF(YEAR, '2003-10-16', CURRENT_DATE), true),
('professor', 'สุพัณณดา  โชติพันธ์', 'Supannada Chotipant', 'supannada@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2005-05-02', TIMESTAMPDIFF(YEAR, '2005-05-02', CURRENT_DATE), true),
('professor', 'สมเกียรติ  วังศิริพิทักษ์', 'Somkiat Wangsiripitak', 'somkiat@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1998-04-27', TIMESTAMPDIFF(YEAR, '1998-04-27', CURRENT_DATE), true),
('professor', 'สุขสันต์  พาณิชพาพิบูล', 'Sooksan Panichpapiboon', 'sooksan@it.kmitl.ac.th', NULL, 0, 80000, 'ศ.ดร.', 'Prof. Dr.', '2006-10-31', TIMESTAMPDIFF(YEAR, '2006-10-31', CURRENT_DATE), true),
('professor', 'ปานวิทย์  ธุวะนุติ', 'Panwit Tuwanut', 'panwit@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2009-12-15', TIMESTAMPDIFF(YEAR, '2009-12-15', CURRENT_DATE), true),
('professor', 'สุภวรรณ  ทัศนประเสริฐ', 'Supawan Tassanaprasert', 'supawan@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2010-03-02', TIMESTAMPDIFF(YEAR, '2010-03-02', CURRENT_DATE), true),
('associate', 'กิติ์สุชาต  พสุภา', 'Kitsuchart Pasupa', 'kitsuchart@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-06-01', TIMESTAMPDIFF(YEAR, '2011-06-01', CURRENT_DATE), true),
('professor', 'กันต์พงษ์  วรรัตน์ปัญญา', 'Kuntpong Woraratpanya', 'kuntpong@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-08-01', TIMESTAMPDIFF(YEAR, '2011-08-01', CURRENT_DATE), true),
('professor', 'สุภกิจ  นุตยะสกุล', 'Supakit Nootyaskool', 'supakit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2011-12-01', TIMESTAMPDIFF(YEAR, '2011-12-01', CURRENT_DATE), true),
('professor', 'มานพ  พันธ์โคกกรวด', 'Manop Phankokkruad', 'manop@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2011-12-01', TIMESTAMPDIFF(YEAR, '2011-12-01', CURRENT_DATE), true),
('professor', 'กนกวรรณ  อัจฉริยะชาญวณิช', 'Kanokwan Atchariyachanvanich', 'kanokwan@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2012-08-16', TIMESTAMPDIFF(YEAR, '2012-08-16', CURRENT_DATE), true),
('professor', 'บัณฑิต  ฐานะโสภณ', 'Bundit Thanasopon', 'bundit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2015-09-11', TIMESTAMPDIFF(YEAR, '2015-09-11', CURRENT_DATE), true),
('professor', 'สิริอร  วิทยากร', 'Sirion Vittayakorn', 'sirion@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-01-16', TIMESTAMPDIFF(YEAR, '2017-01-16', CURRENT_DATE), true),
('professor', 'พรสุรีย์  แจ่มศรี', 'Pornsuree Jamsri', 'pornsuree@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-02-01', TIMESTAMPDIFF(YEAR, '2017-02-01', CURRENT_DATE), true),
('professor', 'สามารถ หมุดและ', 'Samart Moodleah', 'samart@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-02-20', TIMESTAMPDIFF(YEAR, '2017-02-20', CURRENT_DATE), true),
('professor', 'ธราวิเชษฐ์  ธิติจรูญโรจน์', 'Taravichet Titijaroonroj', 'taravichet@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2019-06-03', TIMESTAMPDIFF(YEAR, '2019-06-03', CURRENT_DATE), true),
('professor', 'นนท์  คนึงสุขเกษม', 'Nont Kanungsukkasem', 'nont@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2020-01-02', TIMESTAMPDIFF(YEAR, '2020-01-02', CURRENT_DATE), true),
('professor', 'ประพันธ์  ปวรางกูร', 'Praphan Pavarangkoon', 'praphan@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2020-06-01', TIMESTAMPDIFF(YEAR, '2020-06-01', CURRENT_DATE), true),
('professor', 'ศิรสิทธิ์  โล่ห์ชนะจิต', 'Sirasit Lochanachit', 'sirasit@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2020-09-01', TIMESTAMPDIFF(YEAR, '2020-09-01', CURRENT_DATE), true),
('professor', 'ทัศนัย  พลอยสุวรรณ', 'Tuchsanai Ploysuwan', 'tuchsanai@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2022-06-01', TIMESTAMPDIFF(YEAR, '2022-06-01', CURRENT_DATE), false),
('professor', 'ณัฏฐ์  ดิลกธนากุล', 'Nat Dilokthanakul', 'nat@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2022-07-01', TIMESTAMPDIFF(YEAR, '2022-07-01', CURRENT_DATE), false),
('professor', 'สุวิทย์ ภูมิฤทธิกุล', 'Suvit Poomrittigul', 'suvit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2022-12-01', TIMESTAMPDIFF(YEAR, '2022-12-01', CURRENT_DATE), false),
('professor', 'ภัทรภร  วัฒนาชีพ', 'Bhattarabhorn Wattanacheep', 'Bhattarabhorn@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2023-09-01', TIMESTAMPDIFF(YEAR, '2023-09-01', CURRENT_DATE), false),
('professor', 'อิสสระพงศ์  ค้วนเครือ', 'Issarapong Khuankrue', 'Issarapong@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2023-09-01', TIMESTAMPDIFF(YEAR, '2023-09-01', CURRENT_DATE), false),
('professor', 'บุญเลิศ  วัจจะตรากุล', 'Boonlert Watjatrakul', 'boonlert@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2024-01-02', TIMESTAMPDIFF(YEAR, '2024-01-02', CURRENT_DATE), false),
('professor', 'จันทร์บูรณ์  สถิตวิริยวงศ์', 'Chanboon Sathitwiriyawong', 'chanboon@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),

('research', 'รัตนา วรผลึก', 'Rattana Wolrapaluk', 'rattana@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),
('hr', 'วิภาดา ศิลา', 'Vipada Sila', 'vipada@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),
('finance', 'พิจิตรา สุวรรณศรี', 'Pichitra Suwansri', 'pichitra@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),
('admin', 'tanamat', 'tanamat', 'tanamat@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),

('hr', 'พีรณัฐ ทิพย์รักษ์', 'Peeranut Thiprak', '64070075@it.kmitl.ac.th', '1757151355818.png', 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2024-10-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),
('research', 'research', 'research', '64070075@kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-08-25', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),
('finance', 'finance', 'finance', '64070105@kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2000-09-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),
('associate', 'พี', 'Peeranut Thiprak', 'peeranut.wine@gmail.com', '1757151355818.png', 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2024-10-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),
('dean', 'ศศิ', 'Sasikan Longkachang', 'wine.peeranut@gmail.com', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2000-09-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),
('admin', 'admin', 'admin', 'peeranut.thiprak@gmail.com', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-08-25', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true);

INSERT INTO ConditionPC (
    condition_id, natureAmount, mdpiQuartile1, mdpiQuartile2, otherQuartile1, otherQuartile2, otherQuartile3, otherQuartile4
) VALUES
(1, 70000, 60000, 40000, 60000, 40000, 30000, 20000);

INSERT INTO ConditionCF (
    condition_id, maxLeaveinThai, maxLeaveoutThai, workTimeYears, journalYears, qualityScoreSJR, qualityScoreCIF, qualityScoreCORE,
    expense100ASEAN, expense100Asia, expense100EuropeAmericaAustraliaAfrica,
    expense50ASEAN, expense50Asia, expense50EuropeAmericaAustraliaAfrica
) VALUES
(1, 1, 2, 3, 2, 4, 9.38, 'A', 20000, 40000, 60000, 10000, 20000, 30000);

INSERT INTO `Conference` (`conf_id`, `user_id`, `conf_times`, `conf_days`, `trav_dateStart`, `trav_dateEnd`, `conf_research`, `num_co_researchers`, `name_co_researchers`, `course_co_researchers`, `conf_name`, `meeting_date`, `meeting_venue`, `date_submit_organizer`, `argument_date_review`, `last_day_register`, `meeting_type`, `quality_meeting`, `presenter_type`, `time_of_leave`, `location`, `wos_2_leave`, `name_2_leave`, `withdraw`, `wd_100_quality`, `wd_name_100`, `country_conf`, `num_register_articles`, `regist_amount_1_article`, `total_amount`, `domestic_expenses`, `overseas_expenses`, `travel_country`, `inter_expenses`, `airplane_tax`, `num_days_room`, `room_cost_per_night`, `total_room`, `num_travel_days`, `daily_allowance`, `total_allowance`, `all_money`, `doc_submit_date`) VALUES
(1, 44, 10, '2025-06-01', '2025-07-11', '2025-07-12', '1', 0, 'null', 'null', '1', '2025-07-12', '1', '2025-06-02', '2025-06-11', '2025-06-09', 'facultyHost', '', 'First Author', '1', 'ปากีสถาน', NULL, NULL, '50%', NULL, NULL, 'abroad', 1.00, 1.00, 1.00, NULL, 1.00, 'ปากีสถาน', 1.00, NULL, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 5.00, '2025-06-27');

INSERT INTO `Score` (`sc_id`, `conf_id`, `score_type`, `sjr_score`, `sjr_year`, `hindex_score`, `hindex_year`, `Citation`, `score_result`, `core_rank`) VALUES
(1, 1, NULL, 0.00, 0, 0.00, 0, 0.00, NULL, NULL);

INSERT INTO `Page_Charge` (`pageC_id`, `user_id`, `pageC_times`, `pageC_days`, `journal_name`, `quality_journal`, `pc_isi_year`, `pc_sjr_year`, `pc_scopus_year`, `impact_factor`, `sjr_score`, `cite_score`, `qt_isi`, `qt_sjr`, `qt_scopus`, `support_limit`, `article_title`, `num_co_researchers`, `name_co_researchers`, `course_co_researchers`, `vol_journal`, `issue_journal`, `month`, `year`, `ISSN_ISBN`, `submission_date`, `date_review_announce`, `final_date`, `article_research_ject`, `research_type`, `research_type2`, `name_funding_source`, `budget_limit`, `annual`, `presenter_type`, `request_support`, `doc_submit_date`) VALUES
(1, 44, 1, '2025-06-01', '1', '[\"SJR\"]', NULL, 2024, NULL, NULL, 11.00, NULL, NULL, 1, NULL, 60000, '1', 1, '[\"\", \"1\"]', '[\"\", \"1\"]', NULL, NULL, NULL, NULL, NULL, '2025-06-02', '2025-06-13', '2025-06-23', NULL, NULL, NULL, NULL, NULL, NULL, 'First Author', 12345.00, '2025-06-27'),
(2, 34, 5, '2025-06-25', 'IEEE Transactions on Artificial Intelligence', '[\"SJR\"]', NULL, 2024, NULL, NULL, 1.43, NULL, NULL, 1, NULL, 60000, 'n-LIPO: Framework for Diverse Cooperative Agent Generation using Policy Compatibility', 3, '[\"\", \"Rujikorn Charakorn\", \"Poramate Manoonpong\", \"Nat Dilokthanakul\"]', '[\"\", \"-\", \"-\", \"-\"]', 2025, NULL, NULL, NULL, NULL, '2024-06-27', '2025-04-27', '2025-07-25', 'การสร้างเอเจ้นท์ที่มีความหลากหลายผ่านการเรียนรู้แบบเสริมกำลัง', 'basic', NULL, 'ทุนวิจัยส่งเสริมส่วนงานวิชาการ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง', 492100.00, 2023, 'Corresponding Author', 40000.00, '2025-07-03');

INSERT INTO `Research_KRIS` (`kris_id`, `user_id`, `name_research_th`, `name_research_en`, `research_cluster`, `res_cluster_other`, `res_standard`, `res_standard_trade`, `h_index`, `his_invention`, `participation_percent`, `year`, `project_periodStart`, `project_periodEnd`, `doc_submit_date`) VALUES
(1, 44, 'ไทน', 'thai', '[\"Battery & EV\", \"Materials\"]', NULL, '[\"มีการใช้สัตว์ทดลอง\", \"มีการใช้พันธุ์พืช\"]', '53', 88.00, 'jj', 90.00, 1, '2025-06-27', '2025-07-12', '2025-06-27');

INSERT INTO `Form` (`form_id`, `form_type`, `conf_id`, `pageC_id`, `kris_id`, `form_status`, `edit_data`, `date_form_edit`, `editor`, `professor_reedit`) VALUES
(1, 'Conference', 1, NULL, NULL, 'finance', NULL, '2025-06-27', NULL, NULL),
(2, 'Page_Charge', NULL, 1, NULL, 'approve', NULL, '2025-06-27', NULL, NULL),
(3, 'Research_KRIS', NULL, NULL, 1, 'approve', NULL, '2025-06-27', NULL, NULL),
(4, 'Page_Charge', NULL, 2, NULL, 'finance', NULL, '2025-07-03', NULL, NULL);

INSERT INTO `File_pdf` (`file_id`, `type`, `conf_id`, `pageC_id`, `kris_id`, `kris_file`, `full_page`, `date_published_journals`, `published_journals`, `q_proof`, `call_for_paper`, `fee_receipt`, `fx_rate_document`, `conf_proof`, `pc_proof`, `q_pc_proof`, `invoice_public`, `accepted`, `copy_article`, `upload_article`) VALUES
(1, 'Conference', 1, NULL, NULL, NULL, '1754289760681.pdf', NULL, NULL, NULL, '1754289760661.pdf', '1754359110929.pdf', '1754359110875.pdf', '1754381356785.pdf', NULL, NULL, NULL, '1755227063306.pdf', NULL, NULL),
(2, 'Page_Charge', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1754289760661.pdf', '1754359110929.pdf', '1754359110875.pdf', '1754381356785.pdf', '1755226923295.pdf', '1755227063306.pdf' ),
(3, 'Research_KRIS', NULL, NULL, 1, '1754289760681.pdf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Page_Charge', NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1754289760661.pdf', '1754359110929.pdf', '1754359110875.pdf', '1754381356785.pdf', '1755226923295.pdf', '1755227063306.pdf');

INSERT INTO `Notification` (`noti_id`, `user_id`, `form_id`, `name_form`, `date_update`) VALUES
(1, 44, 1, '1', '2025-06-27'),
(2, 44, 2, '1', '2025-06-27'),
(3, 44, 3, 'ไทน', '2025-06-27'),
(4, 34, 4, 'n-LIPO: Framework for Diverse Cooperative Agent Generation using Policy Compatibility', '2025-07-03');

INSERT INTO `officers_opinion_conf` (`c_office_id`, `hr_id`, `research_id`, `associate_id`, `dean_id`, `conf_id`, `c_hr_result`, `c_hr_reason`, `c_hr_note`, `c_research_result`, `c_research_reason`, `c_associate_result`, `c_dean_result`, `hr_doc_submit_date`, `research_doc_submit_date`, `associate_doc_submit_date`, `dean_doc_submit_date`) VALUES
(1, 41, 40, 44, 4, 1, 'approve', '', NULL, 'approve', NULL, 'approve', 'approve', '2025-06-27', '2025-06-27', '2025-06-27', '2025-06-27');

INSERT INTO `officers_opinion_kris` (`k_office_id`, `user_id`, `kris_id`, `research_admin`, `doc_submit_date`) VALUES
(1, 40, 1, 'acknowledge', '2025-06-27');

INSERT INTO `officers_opinion_pc` (`p_office_id`, `research_id`, `associate_id`, `dean_id`, `pageC_id`, `p_research_result`, `p_research_reason`, `p_associate_result`, `p_dean_acknowledge`, `p_dean_result`, `p_dean_reason`, `research_doc_submit_date`, `associate_doc_submit_date`, `dean_doc_submit_date`) VALUES
(1, 40, 44, 4, 1,
 'approve',
 NULL,
 'approve',
 'acknowledge', 
 'approve',
 NULL,
 '2025-06-27',
 '2025-06-27',
 '2025-06-27'),

 (2, 40, NULL, NULL, 2,
 'approve',
 NULL,
 NULL,
 NULL,            -- p_dean_acknowledge
 NULL,            -- p_dean_result
 NULL,
 '2025-07-03',
 NULL,
 NULL);

INSERT INTO `Budget` (
    `budget_id`, `user_id`, `form_id`, `budget_year`,
    `Research_kris_amount`, `Page_Charge_amount`, `Conference_amount`,
    `num_expenses_approved`, `total_amount_approved`, `remaining_credit_limit`,
    `amount_approval`, `total_remaining_credit_limit`, `doc_submit_date`,
    `travelExpenses`, `allowance`, `withdraw` ) VALUES
(1, 42, 1, 2568,
 NULL, NULL, 1200000.00,
 0, 0.00, 1200000.00,
 20001.00, 1179999.00, '2025-06-27',
 10.00, 100000.00, 100010.00),

(2, 42, 2, 2568,
 NULL, 1230000.00, NULL,
 0, 0.00, 1230000.00,
 12345.00, 1217655.00, '2025-06-27',
 NULL, NULL, 100000.00),

(3, 42, 4, 2568,
 NULL, 700000.00, NULL,
 1, 0.00, 700000.00,
 40000.00, 660000.00, '2025-07-03',
 NULL, NULL, NULL),

(4, 44, 3, 2568,
 60000.00, NULL, NULL,
 0, 0.00, 0.00,
 0.00, 0.00, NULL,
 NULL, NULL, NULL);


UPDATE Users
SET user_nameth = CONVERT(CAST(CONVERT(user_nameth USING latin1) AS BINARY) USING utf8mb4);
UPDATE Users
SET user_positionth = CONVERT(CAST(CONVERT(user_positionth USING latin1) AS BINARY) USING utf8mb4);
