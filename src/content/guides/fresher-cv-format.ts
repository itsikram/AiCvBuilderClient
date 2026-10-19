import type { GuideBody } from "./types";

const body: GuideBody = {
  en: {
    lead:
      "With no job experience, lead with what you do have. Use one page: header and photo, a specific career objective, education with GPA/CGPA, then projects, internships, training, extracurricular activities and skills. Every line should show a skill the employer wants.",
    sections: [
      {
        heading: "What to put on a fresher CV",
        steps: [
          { name: "Career objective", text: "Name the role and one or two strengths that match the circular, for example \"Seeking a Junior Software Engineer role where I can apply my React and Node.js project experience\"." },
          { name: "Education", text: "Your degree first, then HSC and SSC with board, year and GPA. Add your thesis topic or relevant courses if they relate to the job." },
          { name: "Projects and thesis", text: "2–3 academic or personal projects, each with a one-line goal, the tools you used and the outcome. These replace work experience." },
          { name: "Internships and part-time work", text: "Count them all: internships, tuition, freelancing, family business, and volunteering. Describe what you did and learned." },
          { name: "Training and certificates", text: "Short courses from BASIS, BITM, Coursera, LinkedIn Learning or similar, with the year." },
          { name: "Extracurricular activities", text: "Club roles, debating, sports, and volunteering (for example BNCC, Rover Scouts, Red Crescent). Leadership roles show responsibility." },
          { name: "Skills", text: "Hard skills first (MS Office, Excel formulas, programming languages, design tools), then 3–4 soft skills you can prove in an interview." },
        ],
      },
      {
        heading: "Career objective examples for freshers",
        example: {
          title: "Examples",
          lines: [
            "Sales/Marketing: BBA (Marketing) graduate seeking a Management Trainee role in FMCG",
            "sales, bringing campus brand-ambassador experience and strong Bangla/English communication.",
            "",
            "Engineering: B.Sc. in EEE graduate looking for a Graduate Engineer position in",
            "power distribution, with a thesis on solar micro-grids and AutoCAD training.",
            "",
            "Office/Admin: HSC graduate seeking an Office Assistant job, skilled in MS Word,",
            "Excel and Bangla typing (Bijoy and Avro) at 30 wpm.",
          ],
        },
      },
      {
        heading: "Fresher CV tips that make a difference",
        bullets: [
          "Keep it to one page. Recruiters spend seconds on a fresher CV.",
          "Mirror the circular: if it asks for \"MS Excel\" and \"good communication\", use those exact words where they are true.",
          "Use a professional email address, for example firstname.lastname@gmail.com.",
          "Show results even from small projects: \"Built an inventory app used by 3 shops\" beats \"Made an app\".",
          "Ask a teacher or internship supervisor to be a reference. Get their permission first.",
          "Proofread twice, then ask a friend to read it once more.",
        ],
      },
    ],
    faqs: [
      { q: "How do I make a CV with no experience?", a: "Put education, projects, internships, training and extracurricular activities in place of work experience, and write a specific career objective. One page is enough." },
      { q: "Should a fresher CV be one page?", a: "Yes. One well-organised page is ideal for a fresher in Bangladesh." },
      { q: "Should I include SSC and HSC results?", a: "Yes. Bangladeshi employers usually expect SSC and HSC with board, year and GPA, below your university degree." },
      { q: "What skills should a fresher write?", a: "Skills the job circular asks for that you can demonstrate, such as MS Office, Excel, a programming language, design tools or Bangla/English typing, plus a few soft skills such as teamwork or presentation." },
    ],
    cta: {
      title: "Build your first CV with AI help",
      text: "Tell us your degree and target job. The AI suggests a career objective and skills, and you choose what to keep.",
      button: "Create my fresher CV",
    },
  },
  bn: {
    lead:
      "চাকরির অভিজ্ঞতা না থাকলে, যা আছে সেটাই সামনে আনুন। এক পৃষ্ঠায় রাখুন: হেডার ও ছবি, নির্দিষ্ট ক্যারিয়ার অবজেক্টিভ, GPA/CGPA সহ শিক্ষাগত যোগ্যতা, তারপর প্রজেক্ট, ইন্টার্নশিপ, ট্রেনিং, সহশিক্ষা কার্যক্রম ও দক্ষতা। প্রতিটি লাইনে নিয়োগকর্তার চাওয়া কোনো দক্ষতা দেখান।",
    sections: [
      {
        heading: "ফ্রেশারের সিভিতে যা রাখবেন",
        steps: [
          { name: "ক্যারিয়ার অবজেক্টিভ", text: "পদের নাম এবং বিজ্ঞপ্তির সাথে মেলে এমন এক-দুটি শক্তির কথা লিখুন। যেমন: \"React ও Node.js প্রজেক্টের অভিজ্ঞতা কাজে লাগিয়ে জুনিয়র সফটওয়্যার ইঞ্জিনিয়ার হিসেবে কাজ করতে চাই।\"" },
          { name: "শিক্ষাগত যোগ্যতা", text: "আগে আপনার ডিগ্রি, তারপর বোর্ড, সাল ও GPA সহ এইচএসসি ও এসএসসি। চাকরির সাথে প্রাসঙ্গিক হলে থিসিসের বিষয় বা কোর্সের নাম দিন।" },
          { name: "প্রজেক্ট ও থিসিস", text: "২–৩টি একাডেমিক বা নিজস্ব প্রজেক্ট: উদ্দেশ্য, ব্যবহৃত টুল ও ফলাফল এক লাইনে। এগুলোই কাজের অভিজ্ঞতার জায়গা নেবে।" },
          { name: "ইন্টার্নশিপ ও খণ্ডকালীন কাজ", text: "সবকিছু গণ্য করুন: ইন্টার্নশিপ, টিউশনি, ফ্রিল্যান্সিং, পারিবারিক ব্যবসা, স্বেচ্ছাসেবা। কী করেছেন ও কী শিখেছেন লিখুন।" },
          { name: "ট্রেনিং ও সার্টিফিকেট", text: "BASIS, BITM, Coursera, LinkedIn Learning বা এ ধরনের প্রতিষ্ঠানের শর্ট কোর্স, সালসহ।" },
          { name: "সহশিক্ষা কার্যক্রম", text: "ক্লাবের দায়িত্ব, বিতর্ক, খেলাধুলা, স্বেচ্ছাসেবা (যেমন বিএনসিসি, রোভার স্কাউট, রেড ক্রিসেন্ট)। নেতৃত্বের ভূমিকা দায়িত্বশীলতা প্রমাণ করে।" },
          { name: "দক্ষতা", text: "আগে টেকনিক্যাল দক্ষতা (MS Office, Excel ফর্মুলা, প্রোগ্রামিং ভাষা, ডিজাইন টুল), তারপর ইন্টারভিউতে প্রমাণ করতে পারবেন এমন ৩–৪টি সফট স্কিল।" },
        ],
      },
      {
        heading: "ফ্রেশারদের ক্যারিয়ার অবজেক্টিভের উদাহরণ",
        example: {
          title: "উদাহরণ",
          lines: [
            "সেলস/মার্কেটিং: এফএমসিজি সেলসে ম্যানেজমেন্ট ট্রেইনি পদে কাজ করতে আগ্রহী বিবিএ (মার্কেটিং)",
            "গ্র্যাজুয়েট; ক্যাম্পাস ব্র্যান্ড অ্যাম্বাসেডরের অভিজ্ঞতা ও বাংলা-ইংরেজিতে ভালো যোগাযোগ দক্ষতা আছে।",
            "",
            "ইঞ্জিনিয়ারিং: পাওয়ার ডিস্ট্রিবিউশনে গ্র্যাজুয়েট ইঞ্জিনিয়ার পদপ্রার্থী ইইই গ্র্যাজুয়েট;",
            "সোলার মাইক্রো-গ্রিড বিষয়ে থিসিস ও AutoCAD ট্রেনিং সম্পন্ন।",
            "",
            "অফিস/অ্যাডমিন: অফিস সহকারী পদপ্রার্থী এইচএসসি পাস; MS Word, Excel এবং",
            "বাংলা টাইপিংয়ে (বিজয় ও অভ্র) মিনিটে ৩০ শব্দ গতি।",
          ],
        },
      },
      {
        heading: "যে টিপসগুলো পার্থক্য গড়ে দেয়",
        bullets: [
          "এক পৃষ্ঠায় রাখুন। ফ্রেশারের সিভিতে নিয়োগকর্তা কয়েক সেকেন্ড সময় দেন।",
          "বিজ্ঞপ্তির ভাষা ব্যবহার করুন: \"MS Excel\" বা \"ভালো যোগাযোগ দক্ষতা\" চাওয়া হলে, সত্য হলে, হুবহু সেই শব্দগুলো লিখুন।",
          "পেশাদার ইমেইল ব্যবহার করুন, যেমন firstname.lastname@gmail.com।",
          "ছোট প্রজেক্টেও ফলাফল দেখান: \"একটি অ্যাপ বানিয়েছি\" এর চেয়ে \"৩টি দোকানে ব্যবহৃত ইনভেন্টরি অ্যাপ তৈরি করেছি\" ভালো।",
          "শিক্ষক বা ইন্টার্নশিপ সুপারভাইজারকে রেফারেন্স হিসেবে দিন, তবে আগে অনুমতি নিন।",
          "দুবার নিজে পড়ুন, তারপর একজন বন্ধুকে দিয়ে আরেকবার পড়ান।",
        ],
      },
    ],
    faqs: [
      { q: "অভিজ্ঞতা ছাড়া সিভি কীভাবে বানাব?", a: "কাজের অভিজ্ঞতার জায়গায় শিক্ষাগত যোগ্যতা, প্রজেক্ট, ইন্টার্নশিপ, ট্রেনিং ও সহশিক্ষা কার্যক্রম দিন এবং একটি নির্দিষ্ট ক্যারিয়ার অবজেক্টিভ লিখুন। এক পৃষ্ঠাই যথেষ্ট।" },
      { q: "ফ্রেশারের সিভি কি এক পৃষ্ঠার হওয়া উচিত?", a: "হ্যাঁ। বাংলাদেশে ফ্রেশারদের জন্য গোছানো এক পৃষ্ঠার সিভিই আদর্শ।" },
      { q: "এসএসসি ও এইচএসসির ফলাফল কি দিতে হবে?", a: "হ্যাঁ। বাংলাদেশি নিয়োগকর্তারা সাধারণত বিশ্ববিদ্যালয়ের ডিগ্রির নিচে বোর্ড, সাল ও GPA সহ এসএসসি ও এইচএসসি দেখতে চান।" },
      { q: "ফ্রেশার কোন দক্ষতাগুলো লিখবে?", a: "বিজ্ঞপ্তিতে চাওয়া যেসব দক্ষতা আপনি দেখাতে পারবেন, যেমন MS Office, Excel, প্রোগ্রামিং, ডিজাইন টুল বা বাংলা/ইংরেজি টাইপিং। সাথে টিমওয়ার্ক বা প্রেজেন্টেশনের মতো কয়েকটি সফট স্কিল।" },
    ],
    cta: {
      title: "এআই-এর সাহায্যে প্রথম সিভি বানান",
      text: "আপনার ডিগ্রি ও কাঙ্ক্ষিত পদ লিখুন। এআই ক্যারিয়ার অবজেক্টিভ ও দক্ষতা সাজেস্ট করবে, কোনটা রাখবেন সেটা আপনি বেছে নেবেন।",
      button: "ফ্রেশার সিভি তৈরি করুন",
    },
  },
};

export default body;
