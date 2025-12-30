const PHOTO_DIR = 'photos';

const deviceMapping = {
    'SONY': 'SONY',
    'OPPO': 'OPPO',
    'DJI': 'DJI'
};

const folderOrder = ['SONY', 'OPPO', 'DJI'];

const devicePhotoList = {
    'SONY': [
        '11.22-14.jpg',
        'IMG_20251122_195108.jpg',
        'IMG_20251227_231909.jpg',
        'IMG_20251227_232453.jpg'
    ],
    'OPPO': [
        'IMG_20250406_184530.jpg',
        'IMG20250405170300.jpg',
        'IMG_20251227_231550.jpg',
        'IMG_20251227_232307.jpg',
        'IMG_20251228_012224.jpg',
        'IMG20250719185609.jpg',
        'IMG_20251227_231447.jpg',
        'IMG_20251227_232009.jpg',
        'IMG_20251227_232511.jpg'
    ],
    'DJI': [
        'IMG_20251002_220141 - 01.jpg',
        'IMG_20251002_220229 - 01.jpg',
        'IMG_20251002_220301.jpg',
        'IMG_20251009_203905.jpg',
        'IMG_20251009_204034.jpg',
        'IMG_20251111_004024.jpg',
        'IMG_20251206_181525 - 01.jpg',
        '航拍2025-1.jpg',
        '航拍2025-2 - 01.jpg',
        '航拍2025-3 - 01.jpg',
        '航拍2025-4.jpg',
        '航拍2025-5.jpg',
        '航拍2025-6.jpg',
        '航拍2025-7.jpg',
        '航拍2025-8.jpg',
        '航拍2025-9.jpg',
        '苏州-3.jpg'
    ]
};

let photos = [];
let currentIndex = 0;
let isAutoPlaying = false;
let autoPlayTimer = null;
let isAlbumOpened = false;
let isTransitioning = false;

// 预览功能状态变量
let isPreviewOpen = false;
let previewIndex = 0;
let previewScale = 1;
let previewX = 0;
let previewY = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchStartScale = 0;
let touchStartDistance = 0;
let isDragging = false;
let isPinching = false;
let previewStartRect = null;

const elements = {
    introScreen: document.getElementById('introScreen'),
    introContent: document.getElementById('introContent'),
    openAlbumBtn: document.getElementById('openAlbumBtn'),
    albumScreen: document.getElementById('albumScreen'),
    photoContainer: document.getElementById('photoContainer'),
    photoFrame: document.getElementById('photoFrame'),
    photoImage: document.getElementById('photoImage'),
    photoWatermark: document.getElementById('photoWatermark'),
    currentIndexEl: document.getElementById('currentIndex'),
    totalCountEl: document.getElementById('totalCount'),
    playBtn: document.getElementById('playBtn'),
    playIcon: document.getElementById('playIcon'),
    homeBtn: document.getElementById('homeBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    // 预览功能元素
    previewOverlay: document.getElementById('previewOverlay'),
    previewImage: document.getElementById('previewImage'),
    previewCloseBtn: document.getElementById('previewCloseBtn'),
    previewPrevBtn: document.getElementById('previewPrevBtn'),
    previewNextBtn: document.getElementById('previewNextBtn'),
    previewInfo: document.getElementById('previewInfo')
};

function init() {
    preparePhotos();
    bindIntroEvents();
    bindAlbumEvents();
    bindTouchEvents();
    bindPreviewEvents();
    
    requestAnimationFrame(() => {
        elements.introScreen.classList.add('active');
    });
    
    setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
    }, 500);
}

// 使用固定种子的随机数生成器，确保每次洗牌结果一致
function fixedRandom(seed) {
    // 简单的线性同余生成器
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

// Fisher-Yates (Knuth) 洗牌算法，使用固定种子确保每次结果一致
function shufflePhotos() {
    // 使用固定种子，确保每次洗牌顺序相同
    const random = fixedRandom(12345);
    
    // 从数组末尾开始，向前遍历
    for (let i = photos.length - 1; i > 0; i--) {
        // 使用固定种子的随机数选择一个索引，范围是[0, i]
        const j = Math.floor(random() * (i + 1));
        // 交换当前元素与随机选中的元素
        [photos[i], photos[j]] = [photos[j], photos[i]];
        // 更新照片的id，保持连续性
        photos[i].id = i + 1;
        photos[j].id = j + 1;
    }
    console.log('Photos shuffled successfully with fixed order:', photos);
}

function preparePhotos() {
    photos = [];
    
    folderOrder.forEach(folder => {
        const fileList = devicePhotoList[folder] || [];
        fileList.forEach(filename => {
            // 对文件名进行URL编码，处理包含空格和中文的情况
            const encodedFilename = encodeURIComponent(filename);
            photos.push({
                id: photos.length + 1,
                filename: filename,
                folder: folder,
                device: deviceMapping[folder] || folder,
                src: `${PHOTO_DIR}/${folder}/${encodedFilename}`
            });
        });
    });
    
    // 执行随机打乱操作
    shufflePhotos();
    
    // 更新照片总数显示
    elements.totalCountEl.textContent = photos.length;
    console.log(`Total photos: ${photos.length}`);
    
    // 输出照片的实际顺序，用于生成正确的说明文字
    console.log('Photo order:');
    photos.forEach((photo, index) => {
        console.log(`${index + 1}. ${photo.filename} (${photo.device})`);
    });
}

function bindIntroEvents() {
    elements.openAlbumBtn.addEventListener('click', openAlbum);
}

function openAlbum(e) {
    if (e) e.preventDefault();
    
    elements.introContent.classList.add('hidden');
    elements.openAlbumBtn.classList.add('hidden');
    
    setTimeout(() => {
        elements.albumScreen.classList.add('visible');
        elements.introScreen.style.display = 'none';
        isAlbumOpened = true;
        showCurrentPhoto();
    }, 600);
}

function showCurrentPhoto() {
    const photo = photos[currentIndex];
    console.log(`Current photo index: ${currentIndex}`);
    console.log(`Photo data:`, photo);
    
    elements.photoImage.src = photo.src;
    elements.photoImage.alt = `照片 ${photo.id}`;
    elements.currentIndexEl.textContent = currentIndex + 1;
    
    // 设置水印文字
    elements.photoWatermark.textContent = `shot on ${photo.device}`;
}

function navigatePhoto(direction) {
    if (isTransitioning) return;
    
    isTransitioning = true;
    const img = elements.photoImage;
    
    // 移除所有动画，直接切换
    img.style.transition = 'none';
    img.style.opacity = '1';
    
    // 直接更新照片，无延迟
    currentIndex += direction;
    if (currentIndex >= photos.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = photos.length - 1;
    
    showCurrentPhoto();
    isTransitioning = false;
}

function nextPhoto() {
    navigatePhoto(1);
}

function prevPhoto() {
    navigatePhoto(-1);
}

function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    
    if (isAutoPlaying) {
        elements.playBtn.classList.add('active');
        elements.playIcon.textContent = '⏸';
        startAutoPlay();
    } else {
        elements.playBtn.classList.remove('active');
        elements.playIcon.textContent = '▶';
        stopAutoPlay();
    }
}

function startAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => {
        if (!isTransitioning) {
            nextPhoto();
        }
    }, 4000);
}

function stopAutoPlay() {
    if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
    }
}

function goHome() {
    stopAutoPlay();
    isAutoPlaying = false;
    elements.playBtn.classList.remove('active');
    elements.playIcon.textContent = '▶';
    
    elements.albumScreen.classList.remove('visible');
    setTimeout(() => {
        elements.introScreen.style.display = 'flex';
        elements.introContent.classList.remove('hidden');
        elements.openAlbumBtn.classList.remove('hidden');
        elements.introScreen.classList.add('active');
        isAlbumOpened = false;
        currentIndex = 0;
    }, 500);
}

// 移除了照片墙功能模块

function bindAlbumEvents() {
    elements.prevBtn.addEventListener('click', prevPhoto);
    elements.nextBtn.addEventListener('click', nextPhoto);
    elements.playBtn.addEventListener('click', toggleAutoPlay);
    elements.homeBtn.addEventListener('click', goHome);
    
    document.addEventListener('keydown', handleKeyPress);
}

function bindTouchEvents() {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    
    const container = elements.albumScreen;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY);
    }, { passive: true });
    
    function handleSwipe(startX, endX, startY, endY) {
        const swipeThreshold = 50;
        const diffX = startX - endX;
        const diffY = Math.abs(startY - endY);
        
        if (diffY > diffX && diffY > 100) return;
        
        if (Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0) {
                nextPhoto();
            } else {
                prevPhoto();
            }
        }
    }
}

function handleKeyPress(event) {
    // 只保留主界面的键盘事件处理
    if (event.key === 'ArrowLeft') prevPhoto();
    if (event.key === 'ArrowRight') nextPhoto();
    if (event.key === ' ') {
        event.preventDefault();
        toggleAutoPlay();
    }
}

// 预览功能核心逻辑
function bindPreviewEvents() {
    // 绑定图片点击事件
    elements.photoImage.addEventListener('click', () => {
        openPreview(currentIndex);
    });
    
    // 绑定预览控制事件
    elements.previewCloseBtn.addEventListener('click', closePreview);
    elements.previewPrevBtn.addEventListener('click', previewPrevPhoto);
    elements.previewNextBtn.addEventListener('click', previewNextPhoto);
    
    // 绑定预览区域事件
    elements.previewOverlay.addEventListener('click', (e) => {
        if (e.target === elements.previewOverlay) {
            closePreview();
        }
    });
    
    // 绑定预览图片事件
    bindPreviewImageEvents();
    
    // 绑定键盘事件
    document.addEventListener('keydown', (e) => {
        if (isPreviewOpen) {
            e.preventDefault();
            if (e.key === 'Escape') {
                closePreview();
            } else if (e.key === 'ArrowLeft') {
                previewPrevPhoto();
            } else if (e.key === 'ArrowRight') {
                previewNextPhoto();
            }
        }
    });
}

function bindPreviewImageEvents() {
    const img = elements.previewImage;
    
    // 触摸事件
    img.addEventListener('touchstart', handlePreviewTouchStart, { passive: true });
    img.addEventListener('touchmove', handlePreviewTouchMove, { passive: false });
    img.addEventListener('touchend', handlePreviewTouchEnd, { passive: true });
    
    // 鼠标事件
    img.addEventListener('mousedown', handlePreviewMouseDown);
    img.addEventListener('mousemove', handlePreviewMouseMove);
    img.addEventListener('mouseup', handlePreviewMouseUp);
    img.addEventListener('mouseleave', handlePreviewMouseUp);
    img.addEventListener('dblclick', handlePreviewDoubleClick);
    
    // 鼠标滚轮缩放
    img.addEventListener('wheel', handlePreviewWheel);
}

function openPreview(index) {
    if (isPreviewOpen) return;
    
    previewIndex = index;
    previewScale = 1;
    previewX = 0;
    previewY = 0;
    
    // 获取原始图片位置和尺寸
    const originalImg = elements.photoImage;
    const rect = originalImg.getBoundingClientRect();
    previewStartRect = rect;
    
    // 设置预览图片初始状态
    const previewImg = elements.previewImage;
    previewImg.src = photos[previewIndex].src;
    previewImg.style.transformOrigin = 'top left';
    previewImg.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${rect.width / previewImg.naturalWidth})`;
    
    // 更新信息
    updatePreviewInfo();
    
    // 显示预览
    elements.previewOverlay.classList.add('visible');
    elements.previewImage.classList.add('visible');
    
    // 触发过渡动画
    requestAnimationFrame(() => {
        elements.previewOverlay.classList.add('active');
        previewImg.style.transform = 'translate(0, 0) scale(1)';
        previewImg.style.transition = 'transform 0.3s ease-out';
    });
    
    isPreviewOpen = true;
}

function closePreview() {
    if (!isPreviewOpen) return;
    
    const previewImg = elements.previewImage;
    
    // 重置缩放状态
    previewImg.style.transform = `translate(${previewStartRect.left}px, ${previewStartRect.top}px) scale(${previewStartRect.width / previewImg.naturalWidth})`;
    
    // 隐藏预览
    setTimeout(() => {
        elements.previewOverlay.classList.remove('visible', 'active');
        elements.previewImage.classList.remove('visible');
        previewImg.style.transition = '';
        previewImg.style.transform = '';
        isPreviewOpen = false;
    }, 300);
}

function showPreviewPhoto(index) {
    if (index < 0 || index >= photos.length) return;
    
    previewIndex = index;
    const previewImg = elements.previewImage;
    
    // 重置状态
    previewScale = 1;
    previewX = 0;
    previewY = 0;
    
    // 加载新图片
    previewImg.style.opacity = '0';
    previewImg.src = photos[previewIndex].src;
    
    previewImg.onload = () => {
        previewImg.style.opacity = '1';
    };
    
    // 更新信息
    updatePreviewInfo();
}

function updatePreviewInfo() {
    elements.previewInfo.textContent = `${previewIndex + 1}/${photos.length}`;
}

function previewNextPhoto() {
    showPreviewPhoto((previewIndex + 1) % photos.length);
}

function previewPrevPhoto() {
    showPreviewPhoto((previewIndex - 1 + photos.length) % photos.length);
}

// 触摸事件处理
function handlePreviewTouchStart(e) {
    if (e.touches.length === 1) {
        // 单指触摸 - 拖动
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = true;
    } else if (e.touches.length === 2) {
        // 双指触摸 - 缩放
        touchStartDistance = getTouchDistance(e.touches[0], e.touches[1]);
        touchStartScale = previewScale;
        isPinching = true;
    }
}

function handlePreviewTouchMove(e) {
    if (isPinching) {
        // 缩放处理
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = touchStartScale * (currentDistance / touchStartDistance);
        setPreviewScale(scale);
    } else if (isDragging && previewScale > 1) {
        // 拖动处理（仅在缩放后）
        e.preventDefault();
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        movePreviewImage(deltaX, deltaY);
    } else if (isDragging && previewScale === 1) {
        // 单指滑动切换图片
        const deltaX = e.touches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                previewPrevPhoto();
            } else {
                previewNextPhoto();
            }
            isDragging = false;
        }
    }
}

function handlePreviewTouchEnd(e) {
    isDragging = false;
    isPinching = false;
    
    // 向下滑动关闭预览
    if (previewScale === 1) {
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        if (deltaY > 100) {
            closePreview();
        }
    }
}

// 鼠标事件处理
function handlePreviewMouseDown(e) {
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    isDragging = true;
}

function handlePreviewMouseMove(e) {
    if (isDragging && previewScale > 1) {
        e.preventDefault();
        const deltaX = e.clientX - touchStartX;
        const deltaY = e.clientY - touchStartY;
        movePreviewImage(deltaX, deltaY);
    }
}

function handlePreviewMouseUp() {
    isDragging = false;
}

function handlePreviewDoubleClick() {
    if (previewScale === 1) {
        setPreviewScale(2);
    } else {
        setPreviewScale(1);
    }
}

function handlePreviewWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(5, previewScale + delta));
    setPreviewScale(newScale);
}

// 辅助函数
function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function setPreviewScale(scale) {
    previewScale = Math.max(0.5, Math.min(5, scale));
    updatePreviewTransform();
}

function movePreviewImage(deltaX, deltaY) {
    previewX += deltaX;
    previewY += deltaY;
    updatePreviewTransform();
}

function updatePreviewTransform() {
    const img = elements.previewImage;
    img.style.transform = `translate(${previewX}px, ${previewY}px) scale(${previewScale})`;
    img.style.transition = '';
}

document.addEventListener('DOMContentLoaded', init);
