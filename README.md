This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 📊 Badges

![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)
![Next.js](https://img.shields.io/badge/Built%20With-Next.js-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.159-black?logo=three.js&logoColor=white)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Virtual Stitch

Virtual Stitch is a fully interactive 3D t-shirt customization platform built with Next.js, Three.js, Tailwind CSS, and OpenAI integration. Users can upload their own images, generate designs using AI, apply them as decals or full patterns, and download their creations.

## 🚀 Features

- 🖼 **Image Upload**: Upload custom images to apply as logos or full-shirt textures.
- 🤖 **AI-Generated Designs**: Generate unique logos or patterns using the OpenAI API.
- 🎨 **Real-Time Customization**: Apply colors, switch between logo/full modes, and preview instantly.
- 💾 **Download Options**: Download the full 3D canvas or just the applied logo/texture.
- 🔒 **Request Limiting**: Prevents excessive API calls using Upstash Redis.
- 🛠 **Fully Responsive**: Works across devices and screen sizes.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **3D Engine**: [Three.js](https://threejs.org)
- **State Management**: [Valtio](https://valtio.pmnd.rs)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **AI Integration**: [OpenAI API](https://platform.openai.com/)
- **Database & Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Hosting**: [Vercel](https://vercel.com)

## 🖥 Setup & Development

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/chiElephant/VirtualStitch.git
cd VirtualStitch
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Configure Environment Variables

Create a `.env.local` file at the root and add:

```env
OPENAI_API_KEY=your_openai_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 4️⃣ Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## ✅ Testing

All components and API routes are covered by unit and integration tests. We aim for 100% coverage across statements, branches, functions, and lines. Run tests with:

```bash
npm run test
# or with coverage
npm run test:coverage
```

Example coverage report:

![Coverage Report](/images/coverage_report.png)

## 🚀 Deployment

The app is designed for seamless deployment to [Vercel](https://vercel.com). Push your main branch and connect your repository to Vercel for continuous deployment.

## 🖼 Screenshots

### 🏠 Home Page

![Home Screenshot](/images/screenshot_1.png)

### 🎨 Customizer - Color Picker

![Customizer Color Picker](/images/screenshot_2.png)

### 🤖 Customizer - AI Picker

![Customizer AI Picker](/images/screenshot_3.png)

### 📂 Customizer - File Upload

![Customizer File Upload](/images/screenshot_4.png)

### 📥 Download Functionality

![Download Feature](/images/screenshot_5.png)

### 🧪 Test Coverage Report

![Coverage Report](/images/coverage_report.png)

## 📂 Project Structure

```
├── app/
├── components/
├── canvas/
├── config/
├── pages/
├── public/
├── store/
├── styles/
├── .env.local
├── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
