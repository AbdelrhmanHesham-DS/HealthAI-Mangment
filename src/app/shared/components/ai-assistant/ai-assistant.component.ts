import { Component, signal, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface AiMessage {
  role: 'user' | 'bot';
  text: string;
  time: string;
  actions?: { label: string; route: string }[];
}

interface FAQ {
  keywords: string[];
  answer: string;
  actions?: { label: string; route: string }[];
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.css',
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('msgEnd') msgEnd!: ElementRef;

  isOpen       = signal(false);
  isTyping     = signal(false);
  input        = signal('');
  shouldScroll = false;

  messages = signal<AiMessage[]>([{
    role: 'bot',
    text: "Hi! 👋 I'm the **HealthAI Assistant**. I can help you with anything on this platform.\n\nTry asking me about signing up, finding doctors, booking, MediAI, your profile, or anything else!",
    time: this.now(),
    actions: [
      { label: '🔍 Find a Doctor',    route: '/health/doctors' },
      { label: '🩺 MediAI',           route: '/health/symptom-checker' },
      { label: '📝 Sign Up',          route: '/register' },
      { label: '🔐 Sign In',          route: '/login' },
    ],
  }]);

  suggestions = [
    'How do I sign up?',
    'How do I book an appointment?',
    'What is MediAI?',
    'How do I cancel an appointment?',
    'How do I update my profile?',
    'How does doctor approval work?',
  ];

  private readonly faqs: FAQ[] = [

    // ── AUTH ──────────────────────────────────────────────────────────────
    {
      keywords: ['sign up', 'register', 'create account', 'new account', 'join', 'get started'],
      answer: `**Creating an account is easy:**\n\n1. Click **Sign Up** in the top navigation\n2. Choose your role — **Patient** or **Doctor**\n3. Fill in your name, email, phone number, and password\n4. Patients are logged in immediately\n5. Doctors must also add their specialty and certificate link — then wait for admin approval\n\n💡 Your phone number is private for patients, and public for doctors so patients can contact you.`,
      actions: [{ label: '📝 Sign Up Now', route: '/register' }],
    },
    {
      keywords: ['sign in', 'login', 'log in', 'access account', 'my account', 'password', 'credentials'],
      answer: `**To sign in:**\n\n1. Click **Sign In** in the navigation bar\n2. Enter your email and password\n3. You'll be redirected to your dashboard based on your role\n\n**Demo accounts you can use:**\n• 👤 patient@healthai.com / patient123\n• 🩺 doctor@healthai.com / doctor123\n• ⚙️ admin@healthai.com / admin123`,
      actions: [{ label: '🔐 Go to Login', route: '/login' }],
    },
    {
      keywords: ['logout', 'log out', 'sign out', 'exit account'],
      answer: `**To sign out:**\n\n• Click your name/avatar in the top navigation bar\n• Select **Sign Out** from the dropdown menu\n\nYou'll be redirected to the login page. Your data is safely stored in the database.`,
    },
    {
      keywords: ['forgot password', 'reset password', 'change password', 'update password'],
      answer: `**To change your password:**\n\n1. Log in to your account\n2. Go to your **Profile** page\n3. Scroll to the Change Password section\n4. Enter your current password, then your new password\n5. Click Save\n\n⚠️ If you've forgotten your password completely, contact support at the Contact page.`,
      actions: [{ label: '📞 Contact Support', route: '/chatbot/contact' }],
    },
    {
      keywords: ['update profile', 'edit profile', 'change name', 'change phone', 'change email', 'my info', 'personal info'],
      answer: `**To update your profile:**\n\n1. Log in and go to your **Dashboard**\n2. Click **My Profile** (patients) or **My Profile** in the doctor sidebar\n3. Click **Edit Profile**\n4. Update your name, phone, address, blood type, gender, etc.\n5. Click **Save Changes**\n\n📱 Your phone number is private for patients — only doctors you've booked with can see it.`,
      actions: [{ label: '🏠 My Dashboard', route: '/health/dashboard' }],
    },

    // ── DOCTORS ───────────────────────────────────────────────────────────
    {
      keywords: ['find doctor', 'search doctor', 'look for doctor', 'browse doctor', 'specialist', 'which doctor'],
      answer: `**Finding the right doctor:**\n\n1. Go to **Find Doctors** in the navigation\n2. Use the search bar — type a name, specialty, or clinic\n3. Filter by:\n   • 🏙️ City (Cairo, Alexandria, Giza)\n   • 🩺 Specialty\n   • 💻 Visit type (Online/In-person)\n   • ⭐ Minimum rating\n   • 💰 Maximum fee\n4. Click any doctor card to see their full profile, reviews, and availability`,
      actions: [{ label: '🔍 Browse Doctors', route: '/health/doctors' }],
    },
    {
      keywords: ['doctor profile', 'view doctor', 'doctor info', 'doctor details', 'doctor rating', 'doctor review'],
      answer: `**Doctor profile page shows:**\n\n• Full bio and education\n• Specialty and clinic name\n• Rating and patient reviews\n• Available time slots\n• Consultation fee\n• Languages spoken\n• Insurance accepted\n• Phone number (public)\n• Location and address\n\nYou can book directly from the profile or leave a review after your visit.`,
      actions: [{ label: '🔍 Find a Doctor', route: '/health/doctors' }],
    },
    {
      keywords: ['doctor phone', 'contact doctor', 'call doctor', 'reach doctor', 'doctor number'],
      answer: `**Contacting a doctor:**\n\n• Doctor phone numbers are **publicly visible** on their profile page\n• After you book an appointment, the doctor can also see your phone number privately in their dashboard\n• You can choose **Video Call**, **Chat**, or **In-Person** consultation types when booking`,
      actions: [{ label: '🔍 Find a Doctor', route: '/health/doctors' }],
    },

    // ── BOOKING ───────────────────────────────────────────────────────────
    {
      keywords: ['book', 'appointment', 'schedule', 'reserve', 'consult', 'how to book'],
      answer: `**Booking an appointment (3 easy steps):**\n\n**Step 1 — Select Time:**\n• Choose consultation type: Video, In-Person, or Chat\n• Pick an available day\n• Select a time slot\n\n**Step 2 — Details:**\n• Describe your reason for the visit\n• Your info is auto-filled from your profile\n\n**Step 3 — Confirm:**\n• Review the summary\n• Click **Confirm Booking**\n• You'll get a notification instantly!`,
      actions: [
        { label: '📅 Find a Doctor to Book', route: '/health/doctors' },
        { label: '🗓 My Appointments',        route: '/health/appointments' },
      ],
    },
    {
      keywords: ['cancel appointment', 'cancel booking', 'reschedule'],
      answer: `**To cancel an appointment:**\n\n1. Go to **My Appointments** in the navigation\n2. Find the upcoming appointment you want to cancel\n3. Click the **Cancel** button\n\n⚠️ Free cancellation is available up to 24 hours before the appointment. After that, a cancellation fee may apply.\n\nYou cannot reschedule directly — cancel and book a new slot.`,
      actions: [{ label: '🗓 My Appointments', route: '/health/appointments' }],
    },
    {
      keywords: ['video call', 'online consultation', 'virtual visit', 'join call', 'video appointment'],
      answer: `**Video consultations:**\n\n• Select **Video Call** as the consultation type when booking\n• On the day of your appointment, go to **My Appointments**\n• Click the **Join** button next to your video appointment\n• The call will open in your browser — no app needed\n\n💡 Make sure your camera and microphone are allowed in your browser settings.`,
      actions: [{ label: '🗓 My Appointments', route: '/health/appointments' }],
    },
    {
      keywords: ['appointment fee', 'consultation fee', 'cost', 'price', 'payment', 'how much'],
      answer: `**About consultation fees:**\n\n• Each doctor sets their own consultation fee (shown in EGP)\n• The fee is displayed on the doctor's profile and during booking\n• Payment is handled at the clinic or through the platform\n• Completed appointments contribute to the doctor's revenue stats\n\n💡 Use the **Max Fee** filter on the doctors page to find doctors within your budget.`,
      actions: [{ label: '🔍 Find a Doctor', route: '/health/doctors' }],
    },

    // ── MEDIAI ────────────────────────────────────────────────────────────
    {
      keywords: ['mediai', 'symptom', 'checker', 'what doctor', 'which specialist', 'sick', 'pain', 'illness', 'ai diagnosis'],
      answer: `**MediAI — AI Symptom Checker:**\n\nMediAI is our intelligent medical AI that helps you:\n• Analyze your symptoms\n• Identify possible conditions\n• Recommend the right specialist\n• Suggest diagnostic tests\n• Give lifestyle advice\n\n**How to use it:**\n1. Click **MediAI** in the navigation\n2. Describe your symptoms in detail\n3. The AI responds like ChatGPT — you can ask follow-up questions!\n4. Book directly with the recommended doctors\n\n⚠️ MediAI is for informational purposes only — not a medical diagnosis.`,
      actions: [{ label: '🩺 Open MediAI', route: '/health/symptom-checker' }],
    },
    {
      keywords: ['mediai follow up', 'ask mediai', 'mediai question', 'mediai test', 'mediai urgent'],
      answer: `**MediAI understands follow-up questions!**\n\nAfter describing your symptoms, you can ask:\n• *"What tests do I need?"* — get specific diagnostic tests\n• *"How urgent is this?"* — get urgency level (emergency/high/medium/low)\n• *"Tell me more about [condition]"* — detailed specialty info\n• *"What lifestyle changes help?"* — prevention and wellness tips\n\nMediAI remembers your conversation context throughout the session.`,
      actions: [{ label: '🩺 Try MediAI', route: '/health/symptom-checker' }],
    },

    // ── MEDICAL RECORDS ───────────────────────────────────────────────────
    {
      keywords: ['medical record', 'records', 'history', 'prescription', 'lab', 'diagnosis', 'vaccination', 'imaging'],
      answer: `**Your Medical Records:**\n\nYour records are organized by type:\n• 🩺 **Diagnosis** — doctor assessments\n• 💊 **Prescription** — medications prescribed\n• 🧪 **Lab Results** — blood tests, etc.\n• 🔬 **Imaging** — X-rays, MRIs, ultrasounds\n• 💉 **Vaccination** — immunization history\n\n**To view them:**\n1. Log in as a patient\n2. Go to **Dashboard** → **Medical Records** tab\n3. Filter by type using the tabs on the left`,
      actions: [
        { label: '📋 Medical Records', route: '/health/records' },
        { label: '🏠 My Dashboard',    route: '/health/dashboard' },
      ],
    },

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────
    {
      keywords: ['notification', 'reminder', 'alert', 'bell', 'unread'],
      answer: `**Notifications keep you informed:**\n\n• 📅 **Appointment reminders** — before your visit\n• 💬 **Doctor messages** — follow-up notes\n• 🔬 **Lab results** — when results are ready\n• 💊 **Medication reminders** — prescription alerts\n• ✅ **Account updates** — approval status for doctors\n\nClick the 🔔 bell icon in the top navigation to view all notifications. Click any notification to mark it as read.`,
      actions: [{ label: '🏠 My Dashboard', route: '/health/dashboard' }],
    },

    // ── CHATBOT ───────────────────────────────────────────────────────────
    {
      keywords: ['chatbot', 'ai chat', 'multilingual', 'language', 'arabic', 'french', 'nexusai'],
      answer: `**NexusAI Chatbot — Multilingual AI:**\n\nThe chatbot supports **English, Arabic, and French**:\n\n1. Go to the **Chatbot** section from the top navigation\n2. Select your preferred language using the flag buttons\n3. Start chatting — the AI responds in your chosen language\n4. Your conversation history is saved automatically\n5. You can start a new conversation anytime\n\n💡 To connect real ChatGPT responses, an admin needs to add an OpenAI API key to the backend configuration.`,
      actions: [{ label: '🤖 Open Chatbot', route: '/chatbot/chat' }],
    },
    {
      keywords: ['chatgpt', 'openai', 'api key', 'real ai', 'gpt', 'connect ai'],
      answer: `**Connecting ChatGPT to the chatbot:**\n\nTo enable real AI responses powered by ChatGPT:\n\n1. Get your API key from **platform.openai.com/api-keys**\n2. Open the file **backend/.env**\n3. Set: \`OPENAI_API_KEY=sk-your-key-here\`\n4. Open **backend/src/controllers/chat.controller.js**\n5. Follow the commented instructions at the top of the file\n6. Run \`npm install openai\` in the backend folder\n7. Restart the backend server\n\nThe chatbot will then use real GPT-3.5 responses instead of preset answers.`,
    },

    // ── DOCTOR DASHBOARD ──────────────────────────────────────────────────
    {
      keywords: ['doctor dashboard', 'doctor panel', 'doctor appointments', 'my patients', 'doctor profile'],
      answer: `**Doctor Dashboard features:**\n\n• 📅 **Appointments** — view all patient bookings, accept/complete/cancel\n• 👥 **Patients** — manage your patient list with medical history\n• 📋 **Medical Records** — add and manage patient records\n• 👤 **My Profile** — update your info, phone, specialty\n\nYour phone number is **publicly visible** to patients on your profile — make sure it's up to date!\n\nAccess your dashboard by logging in as a doctor.`,
      actions: [{ label: '🩺 Doctor Login', route: '/login' }],
    },
    {
      keywords: ['doctor register', 'become doctor', 'doctor account', 'doctor sign up', 'certificate', 'approval', 'pending doctor'],
      answer: `**Doctor registration process:**\n\n1. Go to **Sign Up** and select **Doctor**\n2. Fill in your name, email, phone, and password\n3. Select your **specialty** from the dropdown\n4. Paste a link to your **medical certificate** (upload to Google Drive, Dropbox, etc.)\n5. Submit — your account is now **pending review**\n6. An admin will review your certificate and approve/reject\n7. You'll receive a notification once approved\n8. After approval, log in normally — your profile shows a ✅ **Verified Doctor** badge`,
      actions: [{ label: '📝 Doctor Sign Up', route: '/register' }],
    },
    {
      keywords: ['doctor approval', 'pending approval', 'account pending', 'waiting approval', 'not approved'],
      answer: `**Doctor account approval:**\n\nAfter registering as a doctor, your account goes through a verification process:\n\n• Status: **Pending** → Admin reviews your certificate → **Approved** or **Rejected**\n• You cannot log in until approved\n• Once approved, you'll get a notification\n• If rejected, contact support to resubmit your credentials\n\nThis process ensures all doctors on the platform are verified professionals.`,
      actions: [{ label: '📞 Contact Support', route: '/chatbot/contact' }],
    },

    // ── ADMIN ─────────────────────────────────────────────────────────────
    {
      keywords: ['admin', 'admin dashboard', 'manage platform', 'statistics', 'admin panel'],
      answer: `**Admin Dashboard capabilities:**\n\n• 📊 **Overview** — total patients, doctors, appointments, revenue\n• 👥 **Patients** — view all registered patients with contact info\n• 🩺 **Doctors** — view all approved doctors\n• ⏳ **Pending Doctors** — approve or reject new doctor applications\n• 📅 **Appointments** — view all platform appointments\n• 📈 **Analytics** — appointment volume chart\n\nLog in with **admin@healthai.com** to access the admin panel.`,
      actions: [{ label: '⚙️ Admin Dashboard', route: '/health/admin' }],
    },
    {
      keywords: ['approve doctor', 'reject doctor', 'verify doctor', 'admin approve'],
      answer: `**Approving doctors (Admin only):**\n\n1. Log in as admin\n2. Go to **Admin Dashboard**\n3. Click **Pending Doctors** in the sidebar\n4. Review the doctor's name, specialty, and certificate link\n5. Click **Approve** ✅ or **Reject** ❌\n6. The doctor receives an automatic notification\n\nApproved doctors can immediately log in and start receiving appointments.`,
      actions: [{ label: '⚙️ Admin Dashboard', route: '/health/admin' }],
    },

    // ── INSURANCE & LANGUAGES ─────────────────────────────────────────────
    {
      keywords: ['insurance', 'bupa', 'axa', 'metlife', 'allianz', 'globemed', 'coverage'],
      answer: `**Insurance information:**\n\nDoctors on HealthAI accept various insurance providers including:\n• Bupa, AXA, MetLife, Allianz, GlobeMed\n\nTo find doctors that accept your insurance:\n1. Go to **Find Doctors**\n2. View individual doctor profiles — insurance accepted is listed there\n\n💡 Always confirm insurance coverage directly with the doctor's clinic before your appointment.`,
      actions: [{ label: '🔍 Find a Doctor', route: '/health/doctors' }],
    },
    {
      keywords: ['language', 'arabic', 'french', 'english', 'multilingual', 'speak arabic'],
      answer: `**Language support:**\n\n• The platform interface is in **English**\n• The **NexusAI Chatbot** supports English, Arabic (العربية), and French (Français)\n• **MediAI** understands symptoms described in any language\n• Many doctors speak multiple languages — check their profile for languages spoken\n\nTo switch chatbot language, use the flag buttons in the chatbot interface.`,
      actions: [{ label: '🤖 Open Chatbot', route: '/chatbot/chat' }],
    },

    // ── TECHNICAL / ACCOUNT ISSUES ────────────────────────────────────────
    {
      keywords: ['not working', 'error', 'bug', 'problem', 'issue', 'broken', 'cant login', "can't login", 'page not loading'],
      answer: `**Troubleshooting common issues:**\n\n🔴 **Can't log in?**\n• Check your email and password are correct\n• Doctors: make sure your account is approved by admin\n• Try clearing your browser cache\n\n🔴 **Page not loading?**\n• Make sure the backend server is running on port 3000\n• Check your internet connection\n\n🔴 **Appointments not showing?**\n• Make sure you're logged in\n• Try refreshing the page\n\nStill having issues? Contact our support team.`,
      actions: [{ label: '📞 Contact Support', route: '/chatbot/contact' }],
    },
    {
      keywords: ['delete account', 'remove account', 'deactivate'],
      answer: `**Account deletion:**\n\nTo delete your account, please contact our support team through the Contact page. An admin can remove your account from the platform.\n\n⚠️ Account deletion is permanent and cannot be undone. All your appointments, records, and data will be removed.`,
      actions: [{ label: '📞 Contact Support', route: '/chatbot/contact' }],
    },
    {
      keywords: ['privacy', 'data', 'secure', 'gdpr', 'personal data', 'my data'],
      answer: `**Your privacy & data security:**\n\n• All passwords are **encrypted** with bcrypt\n• Authentication uses **JWT tokens** (expire after 7 days)\n• Patient phone numbers are **private** — only visible to you and doctors you've booked\n• Doctor phone numbers are **public** — visible to all users\n• Your medical records are only accessible to you\n• We do not share your data with third parties\n\nFor data requests or concerns, contact our support team.`,
      actions: [{ label: '📞 Contact Support', route: '/chatbot/contact' }],
    },

    // ── CONTACT & SUPPORT ─────────────────────────────────────────────────
    {
      keywords: ['contact', 'support', 'help', 'email support', 'reach support', 'customer service'],
      answer: `**Getting support:**\n\n• 📧 Email: support@healthai.com\n• 📞 Phone: +20 100 000 0000\n• 💬 Use the **Contact** page to send a message\n• 🤖 The **NexusAI Chatbot** is available 24/7\n\nOur support team responds within 24 hours on business days.`,
      actions: [{ label: '📞 Contact Us', route: '/chatbot/contact' }],
    },

    // ── PLATFORM INFO ─────────────────────────────────────────────────────
    {
      keywords: ['what is healthai', 'about', 'platform', 'how does it work', 'what can i do'],
      answer: `**Welcome to HealthAI! 🏥**\n\nHealthAI is Egypt's smart healthcare platform. Here's what you can do:\n\n👤 **As a Patient:**\n• Find and book verified doctors\n• Video, in-person, or chat consultations\n• View medical records and history\n• Use MediAI for symptom analysis\n\n🩺 **As a Doctor:**\n• Manage your appointments\n• View patient history\n• Build your verified profile\n\n⚙️ **As an Admin:**\n• Manage the entire platform\n• Approve doctor applications\n• View analytics and statistics`,
      actions: [
        { label: '🏠 Explore Platform', route: '/health' },
        { label: '📝 Sign Up',          route: '/register' },
      ],
    },
    {
      keywords: ['specialties', 'what specialties', 'types of doctors', 'available doctors'],
      answer: `**Available specialties on HealthAI:**\n\n❤️ Cardiology · 🧠 Neurology · 🌿 Dermatology\n👶 Pediatrics · 🦴 Orthopedics · 🧘 Psychiatry\n🫁 Pulmonology · 🩺 General Practice · 🦷 Dentistry · 👁️ Ophthalmology\n\nUse the specialty filter on the Doctors page or click a specialty card on the home page to find doctors in that field.`,
      actions: [{ label: '🔍 Browse by Specialty', route: '/health/doctors' }],
    },
    {
      keywords: ['cities', 'locations', 'cairo', 'alexandria', 'giza', 'where'],
      answer: `**Available cities:**\n\nHealthAI currently has doctors in:\n• 🏙️ **Cairo** (Nasr City, Heliopolis, Maadi, Zamalek, New Cairo)\n• 🌊 **Alexandria** (Smouha, Miami)\n• 🏛️ **Giza** (Dokki)\n\nUse the **City** filter on the Doctors page to find doctors near you.`,
      actions: [{ label: '🔍 Find Doctors by City', route: '/health/doctors' }],
    },
  ];

  toggle() { this.isOpen.update(v => !v); }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.msgEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  send(text?: string) {
    const content = (text || this.input()).trim();
    if (!content || this.isTyping()) return;

    this.messages.update(m => [...m, { role: 'user', text: content, time: this.now() }]);
    this.input.set('');
    this.isTyping.set(true);
    this.shouldScroll = true;

    setTimeout(() => {
      const reply = this.getReply(content);
      this.messages.update(m => [...m, { role: 'bot', ...reply, time: this.now() }]);
      this.isTyping.set(false);
      this.shouldScroll = true;
    }, 600);
  }

  private getReply(input: string): Omit<AiMessage, 'role' | 'time'> {
    const q = input.toLowerCase();

    // Greetings
    if (/^(hi|hello|hey|مرحبا|سلام|bonjour|salut)\b/.test(q)) {
      return {
        text: "Hello! 👋 How can I help you today? You can ask me anything about the platform.",
        actions: [
          { label: '🔍 Find a Doctor',    route: '/health/doctors' },
          { label: '🩺 MediAI',           route: '/health/symptom-checker' },
          { label: '📅 My Appointments',  route: '/health/appointments' },
        ],
      };
    }

    // Thanks
    if (/thank|شكر|merci/.test(q)) {
      return { text: "You're welcome! 😊 Is there anything else I can help you with?" };
    }

    // FAQ matching
    for (const faq of this.faqs) {
      if (faq.keywords.some(k => q.includes(k))) {
        return { text: faq.answer, actions: faq.actions };
      }
    }

    // Fallback
    return {
      text: "I'm not sure about that specific question, but I'm here to help! Try asking about:\n\n• Signing up or logging in\n• Finding or booking a doctor\n• MediAI symptom checker\n• Your appointments or medical records\n• Doctor registration and approval\n• Platform features and how they work",
      actions: [
        { label: '🔍 Find a Doctor',   route: '/health/doctors' },
        { label: '🩺 MediAI',          route: '/health/symptom-checker' },
        { label: '📞 Contact Support', route: '/chatbot/contact' },
      ],
    };
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); this.send(); }
  }

  clearChat() {
    this.messages.set([{
      role: 'bot',
      text: "Chat cleared! 👋 What can I help you with?",
      time: this.now(),
      actions: [
        { label: '🔍 Find a Doctor',   route: '/health/doctors' },
        { label: '🩺 MediAI',          route: '/health/symptom-checker' },
        { label: '📝 Sign Up',         route: '/register' },
      ],
    }]);
  }

  formatText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.isOpen.set(false); }
}
