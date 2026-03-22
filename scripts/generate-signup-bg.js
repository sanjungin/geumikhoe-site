/**
 * Google Gemini API(나노 바나나)로 회원가입 배경 이미지 생성
 * 사용법: GEMINI_API_KEY=your_key node generate-signup-bg.js
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.argv[2];
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'signup-bg.png');

const IMAGE_MODELS = ['gemini-2.5-flash-image', 'gemini-2.5-flash-preview-05-20'];

const PROMPT = `Professional photograph of Republic of Korea Navy aviation pilots and crew in camaraderie, standing together in front of a military aircraft on a runway. 
Warm brotherhood atmosphere, naval aviation officers in flight suits, golden hour lighting. 
Inspiring and welcoming mood that encourages veterans to join an alumni association. 
Military aviation theme, high quality, photorealistic. Wide landscape composition, no text.`;

async function generateImage() {
    if (!API_KEY) {
        console.error('GEMINI_API_KEY 또는 Google API 키가 필요합니다.');
        process.exit(1);
    }

    console.log('회원가입 배경 이미지 생성 중...');

    try {
        for (const model of IMAGE_MODELS) {
            try {
                const imageData = await callGeminiAPI(model);
                if (imageData) {
                    fs.writeFileSync(OUTPUT_PATH, imageData);
                    console.log('저장 완료:', OUTPUT_PATH);
                    return;
                }
            } catch (err) {
                console.log(`  ${model}: ${err.message}`);
            }
        }
        throw new Error('이미지 생성 실패');
    } catch (err) {
        console.error('오류:', err.message);
        process.exit(1);
    }
}

async function callGeminiAPI(model) {
    const response = await fetch(`${API_URL}/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
    });

    if (!response.ok) throw new Error(`${response.status}`);

    const result = await response.json();
    for (const part of result.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) return Buffer.from(part.inlineData.data, 'base64');
    }
    throw new Error('이미지 없음');
}

generateImage();
