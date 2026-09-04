export type MarketingPage = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  moment: string;
  cta: string;
  secondaryCta?: string;
  proof: string[];
  examples: { label: string; text: string }[];
  steps: { title: string; text: string }[];
  closingTitle: string;
  closingText: string;
  keywords: string[];
};

export const MARKETING_PAGES: Record<string, MarketingPage> = {
  "birthday-song": {
    slug: "birthday-song",
    eyebrow: "Birthday songs, made personal",
    title: "Make their story the birthday song.",
    description: "Turn the memories, inside jokes and little details that make someone special into an original birthday song they can keep and share.",
    moment: "birthday",
    cta: "Create a birthday song",
    proof: ["First complete song free", "Use your own lyrics or let Cantoa write them", "Share as a gift page or social video"],
    examples: [
      { label: "For a daughter", text: "A joyful pop song for my daughter turning 16—she loves K-pop, noodles, travel and making everyone laugh." },
      { label: "For a best friend", text: "An upbeat birthday anthem about 12 years of friendship, road trips, bad karaoke and always showing up." },
      { label: "For Dad", text: "A warm acoustic birthday song for Dad about Sunday breakfasts, family jokes and everything he taught us." },
    ],
    steps: [
      { title: "Tell the story", text: "Describe the person, your memories and the mood you want." },
      { title: "Shape the sound", text: "Choose a style, language or vocal direction—or let Cantoa decide." },
      { title: "Give the moment", text: "Create the song, then share it as a gift page, Reel or download." },
    ],
    closingTitle: "A birthday message they will actually replay.",
    closingText: "Skip the generic card. Make something that sounds like them.",
    keywords: ["personalized birthday song", "AI birthday song", "custom birthday music", "birthday song generator"],
  },
  "wedding-song": {
    slug: "wedding-song",
    eyebrow: "Your love story, in music",
    title: "Turn your love story into your song.",
    description: "Create an original wedding song from the moments that brought you here—from the first hello to the vows, the people and the memories in between.",
    moment: "wedding",
    cta: "Create a wedding song",
    proof: ["Original music made from your story", "Paste vows or your own lyrics", "Multilingual and mixed-language songs"],
    examples: [
      { label: "First dance", text: "A cinematic first-dance song about meeting in college, long-distance years and finally building a home together." },
      { label: "Wedding gift", text: "An elegant song from the bride's parents, filled with childhood memories and wishes for the life ahead." },
      { label: "Multilingual", text: "A Hindi + English wedding song with intimate Hindi verses and a soaring English chorus everyone can sing." },
    ],
    steps: [
      { title: "Share the moments", text: "Tell Cantoa how you met, what you love and what you want the song to say." },
      { title: "Choose the feeling", text: "Romantic, cinematic, acoustic, joyful—or simply ask Cantoa to choose." },
      { title: "Make it yours", text: "Refine lyrics, pronunciation and structure before sharing the finished song." },
    ],
    closingTitle: "Not just wedding music. Your wedding music.",
    closingText: "Create a song built around the two people at the center of the day.",
    keywords: ["custom wedding song", "AI wedding song", "personalized first dance song", "wedding music generator"],
  },
  "anniversary-song": {
    slug: "anniversary-song",
    eyebrow: "Years of memories, one song",
    title: "Turn the years you shared into music.",
    description: "Create an anniversary song from the moments, places and small details that made your relationship yours.",
    moment: "wedding",
    cta: "Create an anniversary song",
    proof: ["Built from your real memories", "Add names, dates and meaningful details", "Gift-page sharing included"],
    examples: [
      { label: "25 years", text: "A warm, uplifting anniversary song about 25 years, two children, countless moves and still making each other laugh." },
      { label: "Long-distance", text: "A romantic song about airports, late-night calls and finally living in the same city." },
      { label: "Quiet love", text: "A gentle piano-led song about morning coffee, evening walks and choosing each other every day." },
    ],
    steps: [
      { title: "Remember", text: "Add the milestones and ordinary details that matter most." },
      { title: "Create", text: "Cantoa turns the story into an original song in the style you want." },
      { title: "Surprise them", text: "Share the song privately or turn it into a polished gift experience." },
    ],
    closingTitle: "Because some memories deserve more than a caption.",
    closingText: "Give the story of your years together a melody of its own.",
    keywords: ["anniversary song generator", "personalized anniversary song", "custom love song", "AI anniversary gift"],
  },
  "song-for-someone": {
    slug: "song-for-someone",
    eyebrow: "For someone who matters",
    title: "Say what you mean—with a song made for them.",
    description: "Turn a thank-you, memory, dedication or message into an original song that feels personal instead of generic.",
    moment: "someone",
    cta: "Make a song for someone",
    proof: ["Start from a few sentences", "Add your own lyrics if you have them", "Create in your language or a mix"],
    examples: [
      { label: "For Mom", text: "A heartfelt song thanking Mom for every small sacrifice, every phone call and always making home feel close." },
      { label: "For a friend", text: "An upbeat song for the friend who stayed through every terrible idea and somehow made them good memories." },
      { label: "Just because", text: "A soft love song about the ordinary things I notice—her laugh, the way she sings in the car and Sunday mornings." },
    ],
    steps: [
      { title: "Write naturally", text: "Tell Cantoa what you would say if you had all the right words." },
      { title: "Choose the mood", text: "Heartfelt, joyful, funny, cinematic, acoustic or something entirely your own." },
      { title: "Share the song", text: "Send a link, create a gift page or download the finished track." },
    ],
    closingTitle: "A message can be read once. A song can stay.",
    closingText: "Turn the words you mean into something they can come back to.",
    keywords: ["song for someone", "personalized song gift", "custom song for loved one", "AI song gift"],
  },
  "reel-music": {
    slug: "reel-music",
    eyebrow: "Original music for your content",
    title: "Give your video music made for the moment.",
    description: "Create original music for Reels, Shorts and social videos—from a simple direction or from the video itself.",
    moment: "creator",
    cta: "Create music for a Reel",
    proof: ["Upload video and request a soundtrack", "15-second and square social exports", "Reuse finished audio without new music-generation minutes"],
    examples: [
      { label: "Travel Reel", text: "Create cinematic music that follows this video—soft at the opening, then lift as the landscape opens up." },
      { label: "Product clip", text: "A clean modern instrumental with a hook in the first three seconds and a polished ending for a 15-second launch Reel." },
      { label: "Lifestyle", text: "Warm indie-night-drive music for an evening patio Reel with lights, friends and a relaxed city atmosphere." },
    ],
    steps: [
      { title: "Describe or upload", text: "Tell Cantoa the feeling—or add the video you want to score." },
      { title: "Create the track", text: "Cantoa chooses the right generation workflow behind the scenes." },
      { title: "Export for social", text: "Turn the finished song into vertical, square or lyric-based video formats." },
    ],
    closingTitle: "Your footage should not sound like everyone else's.",
    closingText: "Create music around the story and pacing of your content.",
    keywords: ["AI Reel music", "music for Instagram Reel", "original music for video", "video soundtrack generator"],
  },
  "business-jingle": {
    slug: "business-jingle",
    eyebrow: "Give your brand a sound",
    title: "Turn your brand into music people remember.",
    description: "Create a distinctive jingle or short brand track for social posts, ads, launches and presentations—without starting from a blank music project.",
    moment: "business",
    cta: "Create a business jingle",
    proof: ["15 / 30 / 60-second jingle packs in Studio", "Brand direction in natural language", "Commercial-use eligibility on qualifying paid generations"],
    examples: [
      { label: "Local business", text: "A warm, memorable 15-second jingle for a family-owned bakery—modern, cheerful and easy to hum." },
      { label: "App launch", text: "A clean futuristic brand theme for a productivity app, confident but human, with a recognizable three-note hook." },
      { label: "School or organization", text: "An uplifting anthem around community, pride and belonging with a chorus a group can sing together." },
    ],
    steps: [
      { title: "Describe the brand", text: "Share the personality, audience and message in plain language." },
      { title: "Choose the format", text: "Create a full track or short jingle-ready versions." },
      { title: "Use it everywhere", text: "Take the finished audio into social content, ads and brand presentations." },
    ],
    closingTitle: "Recognition starts before the logo appears.",
    closingText: "Build a sound people can associate with your brand.",
    keywords: ["AI jingle generator", "business jingle maker", "brand music generator", "custom advertising jingle"],
  },
  "hindi-song": {
    slug: "hindi-song",
    eyebrow: "Create in the language that feels like home",
    title: "Turn your story into an original Hindi song.",
    description: "Describe the moment in Hindi or English, add your own lyrics if you have them, and create a song shaped around your language, mood and story.",
    moment: "anything",
    cta: "Create a Hindi song",
    proof: ["Hindi prompts and lyrics", "Pronunciation guidance and name corrections", "Mix Hindi with English or other languages"],
    examples: [
      { label: "Family", text: "माँ के लिए एक खुश और भावुक हिंदी गीत—उनकी हँसी, परिवार को जोड़कर रखने की आदत और घर की यादों के बारे में।" },
      { label: "Celebration", text: "A joyful Hindi birthday song with a catchy chorus, dhol-inspired energy and personal family details." },
      { label: "Devotional-style mood", text: "A peaceful, reverent Hindi song with acoustic instruments and a warm communal chorus." },
    ],
    steps: [
      { title: "Type naturally", text: "Write in Hindi, English or both. Cantoa follows the language direction you give it." },
      { title: "Guide pronunciation", text: "Add names or words that need a specific reading in Advanced controls." },
      { title: "Create and refine", text: "Generate the song, then revise the parts that matter without starting over." },
    ],
    closingTitle: "Your language is part of the story.",
    closingText: "Create music that keeps the words, names and cultural texture closer to what you intended.",
    keywords: ["Hindi AI song generator", "Hindi song maker", "create Hindi song online", "personalized Hindi song"],
  },
  "hinglish-song": {
    slug: "hinglish-song",
    eyebrow: "Two languages. One natural voice.",
    title: "Create a Hinglish song that sounds like your world.",
    description: "Blend Hindi and English in the same song, section by section or naturally within the lyrics—without forcing your story into one language.",
    moment: "anything",
    cta: "Create a Hinglish song",
    proof: ["Hindi + English mixes", "Section-by-section language planning", "Pronunciation controls for names and key words"],
    examples: [
      { label: "Birthday", text: "Hindi verses about our childhood memories, then a big English-Hindi chorus everyone at the party can sing." },
      { label: "Love song", text: "A modern acoustic Hinglish love song—intimate Hindi lines with conversational English phrases and a cinematic chorus." },
      { label: "Family", text: "A warm family song that naturally moves between Hindi and English the way we actually speak at home." },
    ],
    steps: [
      { title: "Mix it your way", text: "Write Hinglish directly or tell Cantoa which sections should use each language." },
      { title: "Fine-tune words", text: "Use pronunciation controls for names, places and phrases that matter." },
      { title: "Keep the emotion", text: "Shape the style and structure without losing the multilingual character of the song." },
    ],
    closingTitle: "You do not have to choose one language to tell one story.",
    closingText: "Create the way you speak, remember and celebrate.",
    keywords: ["Hinglish song generator", "Hindi English song maker", "AI Hinglish music", "multilingual song generator"],
  },
};

export const MARKETING_SLUGS = Object.keys(MARKETING_PAGES);
