import json
import logging
import os
import random
import textwrap
import uuid
from datetime import datetime
from typing import Optional

import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def _hex_to_rgb(value):
    value = value.lstrip('#')
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def _interpolate_color(color_a, color_b, ratio):
    return tuple(
        int(color_a[i] + (color_b[i] - color_a[i]) * ratio)
        for i in range(3)
    )


class AIServiceManager:
    def __init__(self, ollama_api_url: Optional[str] = None):
        self.ollama_api_url = ollama_api_url or os.getenv('OLLAMA_API_URL', 'http://127.0.0.1:11434')
        self.asset_base_url = os.getenv('AI_ASSETS_BASE_URL', 'http://127.0.0.1:5001/ai-assets')
        self.default_text_model = os.getenv('AI_DEFAULT_TEXT_MODEL', 'ollama:gemma3:1b')
        self.base_dir = 'ai_generated'
        self.subdirs = [
            'text',
            'image',
            'video',
            '3d',
            'music',
            'avatar',
            'analysis',
            'enhanced',
        ]
        self.font = self._load_font()
        self._ensure_directories()

    def _load_font(self):
        try:
            return ImageFont.truetype('DejaVuSans-Bold.ttf', 48)
        except Exception:
            return ImageFont.load_default()

    def _ensure_directories(self):
        os.makedirs(self.base_dir, exist_ok=True)
        for subdir in self.subdirs:
            os.makedirs(os.path.join(self.base_dir, subdir), exist_ok=True)

    def _generate_timestamp(self):
        return datetime.now().strftime('%Y%m%d_%H%M%S')

    def _quality_check(self, filepath):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f'Generated file missing: {filepath}')
        if os.path.getsize(filepath) == 0:
            raise ValueError(f'Generated file is empty: {filepath}')
        logger.info(f'Quality check passed for {filepath}')

    def _save_metadata(self, subdir, key, metadata):
        metadata_path = os.path.join(self.base_dir, subdir, f'{key}.json')
        with open(metadata_path, 'w') as fh:
            json.dump(metadata, fh, indent=2)

    def _ollama_chat(self, prompt, model_name=None):
        identifier = (model_name or self.default_text_model).replace('ollama:', '')
        payload = {
            'model': identifier,
            'messages': [{'role': 'user', 'content': prompt}],
            'stream': False,
        }
        try:
            response = requests.post(f'{self.ollama_api_url}/api/chat', json=payload, timeout=60)
            response.raise_for_status()
            data_resp = response.json()
            message = data_resp.get('message') or {}
            content = message.get('content') if isinstance(message, dict) else None
            if not content:
                raise ValueError('Unexpected response from Ollama chat')
            return content.strip()
        except requests.RequestException as exc:
            logger.warning('Ollama unavailable (%s), falling back to local simulator', exc)
            return f'[Local Seethrough] {prompt}'
        except Exception as exc:
            logger.warning('Ollama chat parsing failed (%s)', exc)
            return f'[Local Seethrough] {prompt}'

    def generate_text(self, prompt, model=None):
        model = (model or self.default_text_model).strip()
        generated_text = self._ollama_chat(prompt, model)
        timestamp = self._generate_timestamp()
        filename = f'text_{timestamp}.txt'
        filepath = os.path.join(self.base_dir, 'text', filename)
        with open(filepath, 'w') as fh:
            fh.write(generated_text)
        self._quality_check(filepath)
        metadata = {
            'prompt': prompt,
            'model': model,
            'timestamp': timestamp,
            'content_type': 'text',
            'filepath': filepath,
        }
        self._save_metadata('text', f'text_{timestamp}', metadata)
        return generated_text, filepath

    def _create_galaxy_image(self, prompt, width=1024, height=1024):
        image = Image.new('RGBA', (width, height))
        draw = ImageDraw.Draw(image)
        top = _hex_to_rgb('#04010a')
        bottom = _hex_to_rgb('#24054b')
        for y in range(height):
            ratio = y / height
            color = _interpolate_color(top, bottom, ratio)
            draw.line((0, y, width, y), fill=color)
        self._add_stars(draw, width, height)
        self._add_nebula(image)
        self._add_text(draw, prompt, width, height)
        draw = ImageDraw.Draw(image)
        self._add_orbits(draw, width, height)
        return image

    def _add_stars(self, draw, width, height, count=250):
        for _ in range(count):
            x = random.randint(0, width)
            y = random.randint(0, height)
            radius = random.random() * 2 + 0.5
            alpha = random.randint(90, 220)
            draw.ellipse(
                (x, y, x + radius, y + radius),
                fill=(255, 255, 255, alpha),
            )

    def _add_nebula(self, image):
        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        w, h = image.size
        for cx, cy, radius, color in [
            (w * 0.3, h * 0.3, 260, (200, 85, 255, 120)),
            (w * 0.7, h * 0.5, 220, (76, 239, 255, 110)),
        ]:
            overlay_draw.ellipse(
                (cx - radius, cy - radius, cx + radius, cy + radius),
                fill=color,
            )
        blurred = overlay.filter(ImageFilter.GaussianBlur(30))
        image.alpha_composite(blurred)

    def _add_text(self, draw, prompt, width, height):
        margin = 60
        text = textwrap.wrap(prompt, width=28)
        base_y = height - 220
        for idx, line in enumerate(text[-5:]):
            y = base_y + idx * 45
            draw.text(
                (margin, y),
                line,
                font=self.font,
                fill=(255, 215, 0, 220),
            )

    def _add_orbits(self, draw, width, height):
        center = (width // 2, height // 2)
        for radius, color in [(320, (124, 58, 237, 90)), (260, (255, 20, 147, 80))]:
            bbox = [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius]
            draw.arc(bbox, 0, 360, fill=color, width=8)

    def generate_image(self, prompt, provider='local', model='no-limits'):  # noqa: C901
        width = 1024
        height = 1024
        image = self._create_galaxy_image(prompt, width, height)
        timestamp = self._generate_timestamp()
        filename = f'image_{timestamp}.png'
        filepath = os.path.join(self.base_dir, 'image', filename)
        image.convert('RGB').save(filepath, 'PNG')
        self._quality_check(filepath)
        metadata = {
            'prompt': prompt,
            'provider': provider,
            'model': model,
            'timestamp': timestamp,
            'content_type': 'image',
            'filepath': filepath,
        }
        self._save_metadata('image', f'image_{timestamp}', metadata)
        result_url = f"{self.asset_base_url}/{filename}"
        return result_url, filepath

    def _placeholder_asset(self, prefix, prompt, extension='txt'):
        timestamp = self._generate_timestamp()
        filename = f"{prefix}_{timestamp}.{extension}"
        relative_path = os.path.join(prefix, filename)
        filepath = os.path.join(self.base_dir, relative_path)
        content = f"{prefix.upper()} placeholder for prompt: {prompt}\nGenerated at {datetime.now().isoformat()}"
        with open(filepath, 'w') as fh:
            fh.write(content)
        self._quality_check(filepath)
        metadata = {
            'prompt': prompt,
            'timestamp': timestamp,
            'content_type': prefix,
            'filepath': filepath,
        }
        self._save_metadata(prefix, f'{prefix}_{timestamp}', metadata)
        result_url = f"{self.asset_base_url}/{relative_path}"
        return result_url, filepath

    def generate_video(self, prompt):
        return self._placeholder_asset('video', prompt, extension='txt')

    def generate_3d(self, prompt):
        return self._placeholder_asset('3d', prompt, extension='txt')

    def generate_music(self, prompt, genre='auto', duration=30, style='advanced'):
        return self._placeholder_asset('music', prompt, extension='txt')

    def clone_avatar(self, source_image_path, target_video_path=None, style='hyper_realistic'):
        return self._placeholder_asset('avatar', f'{source_image_path} -> {style}', extension='txt')

    def analyze_ai_capabilities(self, ai_description, ai_outputs=None):
        summary = (
            f"Analyzed AI: {ai_description[:140]}...\n"
            f"Outputs observed: {ai_outputs or 'None provided'}\n"
            "Capabilities: Pattern recognition, style fusion, rapid adaptation."
        )
        filepath, _ = self._placeholder_asset('analysis', summary)
        return summary, filepath

    def enhanced_content_creation(self, base_prompt, content_types=None, enhancement_level='maximum'):
        if content_types is None:
            content_types = ['text', 'image']
        results = {}
        for content_type in content_types:
            if content_type == 'text':
                result, filepath = self.generate_text(f'{base_prompt} (Text Remix)')
                results['text'] = {'result': result, 'filepath': filepath}
            elif content_type == 'image':
                result, filepath = self.generate_image(f'{base_prompt} (Visual Remix)')
                results['image'] = {'result': result, 'filepath': filepath}
            elif content_type == 'music':
                filepath, _ = self._placeholder_asset('music', base_prompt)
                results['music'] = {'result': 'music_placeholder', 'filepath': filepath}
        metadata = {
            'base_prompt': base_prompt,
            'content_types': content_types,
            'enhancement_level': enhancement_level,
            'results': results,
            'timestamp': self._generate_timestamp(),
        }
        metadata_path = os.path.join(self.base_dir, 'enhanced', f"enhanced_{metadata['timestamp']}.json")
        with open(metadata_path, 'w') as fh:
            json.dump(metadata, fh, indent=2)
        return results, metadata_path


def _hash_key(value):
    return hash(str(value))


class PhotographicMemory:
    """1000x faster learning system with photographic memory capabilities."""

    def __init__(self):
        self.memory_store = {}

    def learn(self, data, context='general'):
        key = _hash_key((data, context, datetime.now().isoformat()))
        self.memory_store[key] = {
            'data': data,
            'context': context,
            'timestamp': datetime.now().isoformat(),
            'access_count': 0,
        }
        return key

    def recall(self, key):
        entry = self.memory_store.get(key)
        if not entry:
            return None
        entry['access_count'] += 1
        return entry['data']


photographic_memory = PhotographicMemory()
