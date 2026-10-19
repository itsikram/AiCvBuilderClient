import type { GuideBody } from "./types";

const body: GuideBody = {
  en: {
    lead:
      "Write your CV for one target job at a time. Start with the circular, write a 2–3 line summary or objective for that role, describe each job with results rather than duties, list skills the employer actually asked for, then check it is clear, honest and error-free.",
    sections: [
      {
        heading: "Step by step",
        steps: [
          { name: "Pick the target job", text: "Choose one role and collect two or three circulars for it. Note the skills and qualifications that repeat." },
          { name: "Collect your facts", text: "List every job, internship, project, training and result with dates. Gather your certificates so names and years are exact." },
          { name: "Write the summary or objective", text: "Two or three lines: who you are, what you're good at, and the role you want. Use the job title from the circular." },
          { name: "Turn duties into achievements", text: "Use action verb + task + result: \"Reduced invoice errors by reconciling vendor ledgers weekly\". Add a number only if it is real." },
          { name: "Choose the right skills", text: "Put the skills from the circular that you really have at the top. Group them as technical tools and soft skills." },
          { name: "Add education correctly", text: "Degree, institution, year and result with its scale. Freshers put education above experience." },
          { name: "Keep the design simple", text: "One column for ATS-heavy employers, clear headings, one font, consistent dates. Photo for local jobs." },
          { name: "Tailor it for each application", text: "Adjust the objective, top skills and the order of bullets to match every new circular." },
          { name: "Proofread and export to PDF", text: "Check spelling, phone and email, and that it fits on 1–2 pages. Save as a PDF named Firstname_Lastname_CV.pdf." },
        ],
      },
      {
        heading: "Action verbs that work well",
        bullets: [
          "Managed, coordinated, organised (operations and admin).",
          "Increased, achieved, exceeded, negotiated (sales).",
          "Developed, built, designed, automated (technical).",
          "Analysed, reconciled, reported, audited (finance).",
          "Trained, mentored, supported, resolved (people and customer roles).",
        ],
      },
      {
        heading: "What an ATS-friendly CV means",
        paragraphs: [
          "Many large employers and job portals use applicant tracking systems (ATS) that read the text of your CV. To be read correctly, use standard section headings (Experience, Education, Skills), avoid putting important text inside images, tables or text boxes, and include the exact skill names from the job post. Our templates marked ATS follow these rules.",
        ],
      },
    ],
    faqs: [
      { q: "How do I write a good career objective?", a: "Name the role, mention your strongest relevant qualification or skill, and say what you'll contribute, in 2–3 lines. Avoid generic phrases such as \"hard-working and sincere\"." },
      { q: "How long should my CV be?", a: "One page for freshers, and up to two pages for experienced professionals." },
      { q: "Should I use numbers in my CV?", a: "Yes, when they are true and you can explain them in an interview, for example team size, targets met or time saved. Never invent numbers." },
      { q: "Can AI write my CV?", a: "AI can draft and polish wording quickly, but you should check every line for accuracy. Our AI never adds facts you didn't give it, and you approve each suggestion." },
    ],
    cta: {
      title: "Write your CV with an AI assistant",
      text: "Get suggested objectives, stronger bullet points and skills for your job title, in English or Bangla. Nothing changes until you approve it.",
      button: "Start writing",
    },
  },
  bn: {
    lead:
      "একবারে একটি নির্দিষ্ট পদের জন্য সিভি লিখুন। বিজ্ঞপ্তি দিয়ে শুরু করুন, সেই পদের জন্য ২–৩ লাইনের সারসংক্ষেপ বা অবজেক্টিভ লিখুন, প্রতিটি চাকরিতে দায়িত্বের বদলে ফলাফল দেখান, নিয়োগকর্তা যে দক্ষতা চেয়েছেন সেগুলো লিখুন, তারপর দেখে নিন সিভিটি স্পষ্ট, সৎ ও নির্ভুল কি না।",
    sections: [
      {
        heading: "ধাপে ধাপে",
        steps: [
          { name: "লক্ষ্য পদ ঠিক করুন", text: "একটি পদ বেছে নিন এবং সেই পদের দুই-তিনটি বিজ্ঞপ্তি সংগ্রহ করুন। বারবার আসা দক্ষতা ও যোগ্যতাগুলো লিখে রাখুন।" },
          { name: "তথ্য সংগ্রহ করুন", text: "প্রতিটি চাকরি, ইন্টার্নশিপ, প্রজেক্ট, ট্রেনিং ও ফলাফল তারিখসহ লিখুন। নাম ও সাল নির্ভুল রাখতে সনদগুলো হাতের কাছে রাখুন।" },
          { name: "সারসংক্ষেপ বা অবজেক্টিভ লিখুন", text: "দুই-তিন লাইনে: আপনি কে, কীসে দক্ষ এবং কোন পদ চান। বিজ্ঞপ্তির পদের নামটিই ব্যবহার করুন।" },
          { name: "দায়িত্বকে অর্জনে রূপ দিন", text: "অ্যাকশন ভার্ব + কাজ + ফলাফল: \"সাপ্তাহিক ভেন্ডর লেজার মিলিয়ে ইনভয়েসের ভুল কমিয়েছি\"। সংখ্যা দিন শুধু সত্য হলে।" },
          { name: "সঠিক দক্ষতা বাছুন", text: "বিজ্ঞপ্তির যেসব দক্ষতা সত্যিই আপনার আছে, সেগুলো উপরে রাখুন। টেকনিক্যাল টুল ও সফট স্কিল আলাদা করে লিখুন।" },
          { name: "শিক্ষাগত যোগ্যতা ঠিকভাবে লিখুন", text: "ডিগ্রি, প্রতিষ্ঠান, সাল এবং স্কেলসহ ফলাফল। ফ্রেশাররা অভিজ্ঞতার আগে শিক্ষা রাখবেন।" },
          { name: "ডিজাইন সহজ রাখুন", text: "ATS ব্যবহারকারী প্রতিষ্ঠানের জন্য এক কলাম, স্পষ্ট শিরোনাম, একটি ফন্ট, একই ধাঁচের তারিখ। দেশের চাকরিতে ছবি দিন।" },
          { name: "প্রতিটি আবেদনের জন্য মিলিয়ে নিন", text: "নতুন বিজ্ঞপ্তি অনুযায়ী অবজেক্টিভ, প্রধান দক্ষতা ও বুলেটের ক্রম বদলান।" },
          { name: "প্রুফরিড করে PDF করুন", text: "বানান, ফোন ও ইমেইল যাচাই করুন এবং ১–২ পৃষ্ঠার মধ্যে আছে কি না দেখুন। Firstname_Lastname_CV.pdf নামে PDF সংরক্ষণ করুন।" },
        ],
      },
      {
        heading: "কার্যকর অ্যাকশন ভার্ব (ইংরেজি সিভির জন্য)",
        bullets: [
          "Managed, coordinated, organised: অপারেশন ও অ্যাডমিন।",
          "Increased, achieved, exceeded, negotiated: সেলস।",
          "Developed, built, designed, automated: টেকনিক্যাল।",
          "Analysed, reconciled, reported, audited: ফাইন্যান্স।",
          "Trained, mentored, supported, resolved: মানুষ ও গ্রাহকসেবা।",
        ],
      },
      {
        heading: "ATS-বান্ধব সিভি মানে কী",
        paragraphs: [
          "অনেক বড় প্রতিষ্ঠান ও জব পোর্টাল অ্যাপ্লিকেন্ট ট্র্যাকিং সিস্টেম (ATS) ব্যবহার করে, যা আপনার সিভির লেখা পড়ে। ঠিকভাবে পড়ানোর জন্য প্রচলিত শিরোনাম (Experience, Education, Skills) ব্যবহার করুন, জরুরি লেখা ছবি, টেবিল বা টেক্সট বক্সে রাখবেন না, এবং বিজ্ঞপ্তির দক্ষতার নাম হুবহু লিখুন। আমাদের ATS চিহ্নিত টেমপ্লেটগুলো এই নিয়ম মেনে তৈরি।",
        ],
      },
    ],
    faqs: [
      { q: "ভালো ক্যারিয়ার অবজেক্টিভ কীভাবে লিখব?", a: "পদের নাম, আপনার সবচেয়ে প্রাসঙ্গিক যোগ্যতা বা দক্ষতা এবং আপনি কী অবদান রাখবেন, ২–৩ লাইনে লিখুন। \"পরিশ্রমী ও আন্তরিক\" ধরনের সাধারণ কথা এড়িয়ে চলুন।" },
      { q: "সিভি কত পৃষ্ঠার হওয়া উচিত?", a: "ফ্রেশারদের এক পৃষ্ঠা, অভিজ্ঞদের সর্বোচ্চ দুই পৃষ্ঠা।" },
      { q: "সিভিতে কি সংখ্যা ব্যবহার করব?", a: "হ্যাঁ, যদি সত্য হয় এবং ইন্টারভিউতে ব্যাখ্যা করতে পারেন, যেমন টিমের আকার, অর্জিত টার্গেট বা বাঁচানো সময়। কখনো বানানো সংখ্যা দেবেন না।" },
      { q: "এআই কি সিভি লিখে দিতে পারে?", a: "এআই দ্রুত খসড়া ও ভাষা সুন্দর করতে পারে, তবে প্রতিটি লাইন আপনাকে যাচাই করতে হবে। আমাদের এআই আপনার না দেওয়া কোনো তথ্য যোগ করে না, আর প্রতিটি পরামর্শ আপনি অনুমোদন করেন।" },
    ],
    cta: {
      title: "এআই সহকারীর সাথে সিভি লিখুন",
      text: "বাংলা বা ইংরেজিতে অবজেক্টিভ, শক্তিশালী বুলেট পয়েন্ট ও পদ অনুযায়ী দক্ষতার পরামর্শ পান। আপনি অনুমোদন না দেওয়া পর্যন্ত কিছুই বদলাবে না।",
      button: "লেখা শুরু করুন",
    },
  },
};

export default body;
