/**
 * Google Gemini API(나노 바나나)를 사용하여 4번 슬라이드 이미지 생성
 * 사용법: GEMINI_API_KEY=your_key node generate-slide4.js
 *     또는: node generate-slide4.js your_api_key
 *
 * Google AI Studio(https://aistudio.google.com/app/apikey)에서 API 키 발급
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.argv[2];
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'slide4-thanks.png');

// Gemini 이미지 생성 지원 모델 (나노 바나나)
const IMAGE_MODELS = [
    'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-preview-image-generation',
];

const PROMPT = `Create a solemn and honorable commemorative image for Republic of Korea Navy Marine Corps aviation veterans association. 
Deep navy blue background with golden accents. Theme of gratitude and appreciation for military service. 
Golden wings badge motif, formal prestigious atmosphere. Military aviation theme, dignified and respectful mood. 
Wide cinematic 16:9 landscape, no text, photorealistic quality.`;

async function generateImage() {
    if (!API_KEY) {
        console.error('Google API 키가 필요합니다. 사용법:');
        console.error('  GEMINI_API_KEY=your_key node generate-slide4.js');
        console.error('  또는: node generate-slide4.js your_api_key');
        console.error('');
        console.error('API 키 발급: https://aistudio.google.com/app/apikey');
        process.exit(1);
    }

    console.log('Google Gemini API로 4번 슬라이드 이미지 생성 중...');

    try {
        let imageData = null;
        let lastError = null;

        for (const model of IMAGE_MODELS) {
            try {
                console.log(`모델 시도: ${model}`);
                imageData = await callGeminiAPI(model);
                if (imageData) break;
            } catch (err) {
                lastError = err;
                console.log(`  → ${err.message}`);
            }
        }

        if (!imageData) {
            throw lastError || new Error('이미지 생성 실패');
        }

        fs.writeFileSync(OUTPUT_PATH, imageData);
        console.log('저장 완료:', OUTPUT_PATH);

    } catch (err) {
        console.error('오류:', err.message);
        if (err.response) {
            try {
                const body = await err.response.json();
                console.error('상세:', JSON.stringify(body, null, 2));
            } catch (_) {}
        }
        process.exit(1);
    }
}

async function callGeminiAPI(model) {
    const url = `${API_URL}/${model}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: PROMPT }]
            }],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE'],
            }
        })
    });

    if (!response.ok) {
        const err = new Error(`API 오류: ${response.status} ${response.statusText}`);
        err.response = response;
        throw err;
    }

    const result = await response.json();

    if (!result.candidates?.[0]?.content?.parts) {
        throw new Error(result.error?.message || '응답 형식 오류');
    }

    for (const part of result.candidates[0].content.parts) {
        if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, 'base64');
        }
    }

    throw new Error('생성된 이미지가 없습니다');
}

generateImage();
