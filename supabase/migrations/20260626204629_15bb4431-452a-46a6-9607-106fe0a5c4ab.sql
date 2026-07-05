
WITH domains AS (
  SELECT * FROM (VALUES
    ('Software Engineering','Technology',
      ARRAY['Frontend Developer Intern','Backend Developer Intern','Full-Stack Developer Intern','Software Engineering Intern','Web Developer Intern'],
      ARRAY['JavaScript','TypeScript','React','Node.js','HTML/CSS','Git','REST APIs','SQL','Problem Solving','OOP'],
      ARRAY['React','Node.js','PostgreSQL','TypeScript','Tailwind CSS','Express','Docker'],
      ARRAY['Build and maintain user-facing features','Write clean, testable code','Collaborate with senior engineers in code reviews','Fix bugs and improve performance','Integrate REST APIs']),
    ('Data Science & AI','Technology',
      ARRAY['Data Science Intern','Machine Learning Intern','AI Research Intern','Data Analyst Intern','MLOps Intern'],
      ARRAY['Python','Pandas','NumPy','Machine Learning','SQL','Statistics','Data Visualization','scikit-learn','Deep Learning','Communication'],
      ARRAY['Python','TensorFlow','PyTorch','Pandas','Jupyter','SQL','PowerBI'],
      ARRAY['Clean and analyze large datasets','Build and evaluate ML models','Create dashboards and reports','Present findings to stakeholders','Support data pipelines']),
    ('Product & UX Design','Technology',
      ARRAY['UX Design Intern','UI Designer Intern','Product Design Intern','Product Management Intern','UX Research Intern'],
      ARRAY['Figma','Wireframing','Prototyping','User Research','Design Systems','Usability Testing','Communication','Empathy','Adobe XD','Visual Design'],
      ARRAY['Figma','Adobe XD','Notion','Miro','Maze'],
      ARRAY['Design wireframes and prototypes','Conduct user interviews','Maintain the design system','Collaborate with engineers on handoff','Run usability tests']),
    ('Digital Marketing','Marketing',
      ARRAY['Digital Marketing Intern','Social Media Intern','SEO Intern','Growth Marketing Intern','Performance Marketing Intern'],
      ARRAY['SEO','Social Media','Google Analytics','Content Marketing','Copywriting','Canva','Facebook Ads','Communication','Creativity','Email Marketing'],
      ARRAY['Google Analytics','Meta Ads Manager','Canva','HubSpot','Mailchimp'],
      ARRAY['Plan and schedule social media content','Run and optimize ad campaigns','Track campaign performance','Write marketing copy','Support SEO efforts']),
    ('Business & Operations','Business',
      ARRAY['Business Operations Intern','Strategy Intern','Operations Analyst Intern','Project Management Intern','Business Analyst Intern'],
      ARRAY['Excel','Communication','Problem Solving','Project Management','Data Analysis','Presentation','Stakeholder Management','Process Improvement','Critical Thinking','Documentation'],
      ARRAY['Excel','PowerPoint','Notion','Asana','Jira'],
      ARRAY['Support day-to-day operations','Analyze business processes','Prepare reports and presentations','Coordinate between teams','Track project milestones']),
    ('Finance & Accounting','Finance',
      ARRAY['Finance Intern','Accounting Intern','Investment Analyst Intern','Financial Analyst Intern','Audit Intern'],
      ARRAY['Excel','Financial Modeling','Accounting','Analytical Skills','Attention to Detail','Bookkeeping','Communication','Budgeting','Reporting','QuickBooks'],
      ARRAY['Excel','QuickBooks','Tally','PowerPoint','SAP'],
      ARRAY['Assist with financial reporting','Maintain accurate records','Support budgeting and forecasting','Reconcile accounts','Prepare financial summaries']),
    ('Content & Communications','Media',
      ARRAY['Content Writer Intern','Copywriting Intern','Communications Intern','Editorial Intern','Content Strategy Intern'],
      ARRAY['Writing','Editing','Research','Storytelling','SEO Writing','Communication','Creativity','Grammar','Content Planning','Social Media'],
      ARRAY['Google Docs','Grammarly','WordPress','Canva','Notion'],
      ARRAY['Write articles and blog posts','Edit and proofread content','Research industry topics','Maintain editorial calendar','Collaborate with the design team']),
    ('Human Resources','Business',
      ARRAY['HR Intern','Talent Acquisition Intern','People Operations Intern','HR Analytics Intern','Recruitment Intern'],
      ARRAY['Communication','Recruiting','Organization','Excel','Interpersonal Skills','Confidentiality','Onboarding','Attention to Detail','Empathy','Documentation'],
      ARRAY['Excel','LinkedIn Recruiter','BambooHR','Google Workspace'],
      ARRAY['Screen and shortlist candidates','Coordinate interviews','Support onboarding','Maintain HR records','Assist with employee engagement']),
    ('Sales & Customer Success','Business',
      ARRAY['Sales Intern','Customer Success Intern','Business Development Intern','Account Management Intern','Inside Sales Intern'],
      ARRAY['Communication','Negotiation','CRM','Relationship Building','Persuasion','Excel','Customer Service','Problem Solving','Presentation','Empathy'],
      ARRAY['Salesforce','HubSpot','Excel','Zendesk','Slack'],
      ARRAY['Reach out to potential clients','Maintain the sales pipeline','Support customer onboarding','Resolve customer queries','Prepare sales reports']),
    ('Cybersecurity','Technology',
      ARRAY['Cybersecurity Intern','Security Analyst Intern','SOC Intern','Penetration Testing Intern','Information Security Intern'],
      ARRAY['Networking','Linux','Python','Security Fundamentals','Problem Solving','Cryptography','SIEM','Risk Assessment','Communication','Attention to Detail'],
      ARRAY['Kali Linux','Wireshark','Burp Suite','Python','Splunk'],
      ARRAY['Monitor security alerts','Assist with vulnerability assessments','Document incidents','Support security audits','Research emerging threats']),
    ('Mobile Development','Technology',
      ARRAY['Android Developer Intern','iOS Developer Intern','Mobile App Developer Intern','Flutter Developer Intern','React Native Intern'],
      ARRAY['Kotlin','Swift','Flutter','Dart','React Native','Git','REST APIs','UI Development','Problem Solving','Java'],
      ARRAY['Flutter','Kotlin','Swift','Firebase','React Native'],
      ARRAY['Develop mobile app features','Fix bugs and crashes','Integrate APIs','Optimize app performance','Collaborate on UI implementation']),
    ('DevOps & Cloud','Technology',
      ARRAY['DevOps Intern','Cloud Engineering Intern','Site Reliability Intern','Platform Engineering Intern','Infrastructure Intern'],
      ARRAY['Linux','Docker','CI/CD','AWS','Bash','Git','Kubernetes','Networking','Python','Monitoring'],
      ARRAY['Docker','Kubernetes','AWS','GitHub Actions','Terraform'],
      ARRAY['Maintain CI/CD pipelines','Automate deployments','Monitor infrastructure','Support cloud environments','Write infrastructure scripts'])
  ) AS d(domain, industry, titles, skills, tech, resp)
),
companies AS (
  SELECT * FROM (VALUES
    ('bKash','Fintech','Dhaka'),
    ('Nagad','Fintech','Dhaka'),
    ('Pathao','Startup','Dhaka'),
    ('Shohoz','Startup','Dhaka'),
    ('Chaldal','Startup','Dhaka'),
    ('Daraz Bangladesh','E-commerce','Dhaka'),
    ('Grameenphone','Telecom','Dhaka'),
    ('Robi Axiata','Telecom','Dhaka'),
    ('Banglalink','Telecom','Dhaka'),
    ('BRAC','NGO','Dhaka'),
    ('BRAC Bank','Bank','Dhaka'),
    ('The City Bank','Bank','Dhaka'),
    ('Square Group','Conglomerate','Dhaka'),
    ('Walton','Manufacturing','Gazipur'),
    ('Pridesys IT','IT Services','Dhaka'),
    ('TigerIT Bangladesh','IT Services','Dhaka'),
    ('Therap BD','Software','Dhaka'),
    ('Cefalo Bangladesh','Software','Dhaka'),
    ('Brain Station 23','Software','Dhaka'),
    ('SELISE Digital Platforms','Software','Dhaka'),
    ('Kaz Software','Software','Dhaka'),
    ('Enosis Solutions','Software','Dhaka'),
    ('DataSoft Systems','Software','Dhaka'),
    ('ShopUp','Startup','Dhaka'),
    ('Sheba.xyz','Startup','Dhaka'),
    ('10 Minute School','EdTech','Dhaka'),
    ('Intelligent Machines','AI','Dhaka'),
    ('Bondstein Technologies','IoT','Dhaka'),
    ('Augmedix Bangladesh','HealthTech','Dhaka'),
    ('Inverse AI','AI','Dhaka'),
    ('Gaze','Startup','Dhaka'),
    ('Polygon Technology','Software','Chittagong'),
    ('Nordic Solutions','IT Services','Sylhet'),
    ('Riverstone Labs','Startup','Dhaka')
  ) AS c(company, ctype, city)
),
salaries AS (
  SELECT * FROM (VALUES
    ('Unpaid'),('৳8,000 - ৳12,000/month'),('৳10,000 - ৳15,000/month'),
    ('৳12,000 - ৳18,000/month'),('৳15,000 - ৳25,000/month'),
    ('৳20,000 - ৳30,000/month'),('Stipend + performance bonus')
  ) AS s(salary)
),
durations AS (
  SELECT * FROM (VALUES ('2 months'),('3 months'),('4 months'),('6 months'),('3-6 months')) AS du(duration)
),
levels AS (
  SELECT * FROM (VALUES ('Entry-level'),('Beginner-friendly'),('Intermediate')) AS l(experience_level)
),
models AS (
  SELECT * FROM (VALUES ('On-site'),('Remote'),('Hybrid')) AS m(work_model)
)
INSERT INTO public.internships
  (title, company, company_type, location, salary, duration, requirements, preferred_skills, responsibilities, tech_stack, experience_level, work_model, domain, industry, description)
SELECT
  pick.title,
  c.company,
  c.ctype,
  c.city || ', Bangladesh',
  s.salary,
  du.duration,
  to_jsonb((SELECT array_agg(x) FROM (SELECT unnest(d.skills) AS x LIMIT 4) sub)),
  to_jsonb((SELECT array_agg(x) FROM (SELECT unnest(d.skills) AS x OFFSET 4 LIMIT 4) sub)),
  to_jsonb(d.resp),
  to_jsonb(d.tech),
  l.experience_level,
  m.work_model,
  d.domain,
  d.industry,
  format(
    '%s is hiring a %s for a %s %s internship based in %s. You''ll join the %s team and work on real projects: %s. This is a great opportunity for students looking to grow in %s. Compensation: %s.',
    c.company, pick.title, du.duration, m.work_model, c.city, d.domain,
    d.resp[1] || ', ' || d.resp[2], d.domain, s.salary
  )
FROM generate_series(1, 210) g
CROSS JOIN LATERAL (SELECT * FROM domains ORDER BY random() LIMIT 1) d
CROSS JOIN LATERAL (SELECT * FROM companies ORDER BY random() LIMIT 1) c
CROSS JOIN LATERAL (SELECT * FROM salaries ORDER BY random() LIMIT 1) s
CROSS JOIN LATERAL (SELECT * FROM durations ORDER BY random() LIMIT 1) du
CROSS JOIN LATERAL (SELECT * FROM levels ORDER BY random() LIMIT 1) l
CROSS JOIN LATERAL (SELECT * FROM models ORDER BY random() LIMIT 1) m
CROSS JOIN LATERAL (SELECT (d.titles[1 + floor(random() * array_length(d.titles,1))::int]) AS title) pick;
