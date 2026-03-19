import './css/style.css';
// Инициализация состояния
const INITIAL_STATE = {
    columns: [
        { id: 1, title: 'To Do', cards: [] },
        { id: 2, title: 'In Progress', cards: [] },
        { id: 3, title: 'Done', cards: [] }
    ]
};

// Работа с LocalStorage
const STORAGE_KEY = 'trelloBoardState';

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Переменные для drag&drop
let draggedCard = null;
let draggedCardIndex = -1;
let draggedFromColumnId = -1;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    renderBoard();
    setupEventListeners();
});

// Отрисовка доски на основе состояния из LocalStorage
function renderBoard() {
    const state = loadState();
    state.columns.forEach(column => {
        const columnElement = document.getElementById(`column-${column.id}`);
        columnElement.innerHTML = '';

        column.cards.forEach((card, index) => {
            const cardElement = createCardElement(card.id, card.content, column.id, index);
            columnElement.appendChild(cardElement);
        });
    });
}

// Создание элемента карточки
function createCardElement(cardId, content, columnId, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardId = cardId;
    card.dataset.columnId = columnId;
    card.dataset.index = index;
    card.draggable = true;

    card.innerHTML = `
        <div>${content}</div>
        <span class="delete-btn" onclick="deleteCard(${cardId})">×</span>
    `;

    // Обработчики drag&drop
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

// Добавление новой карточки
function addCard(columnId) {
    const content = prompt('Введите текст карточки:');
    if (!content) return;

    const state = loadState();
    const newCard = {
        id: Date.now(), // Уникальный ID
        content: content
    };

    const column = state.columns.find(col => col.id === columnId);
    if (column) {
        column.cards.push(newCard);
        saveState(state);
        renderBoard();
    }
}

// Удаление карточки
function deleteCard(cardId) {
    if (!confirm('Удалить карточку?')) return;

    const state = loadState();

    state.columns.forEach(column => {
        column.cards = column.cards.filter(card => card.id !== cardId);
    });

    saveState(state);
    renderBoard();
}

// Обработчики drag&drop
function handleDragStart(e) {
    draggedCard = this;
    draggedFromColumnId = parseInt(this.dataset.columnId);
    draggedCardIndex = parseInt(this.dataset.index);

    this.classList.add('dragging');
}

function handleDragEnd() {
    this.classList.remove('dragging');
    resetDropZones();
    draggedCard = null;
    draggedFromColumnId = -1;
    draggedCardIndex = -1;
}

// Сброс всех индикаторов зоны сброса
function resetDropZones() {
    document.querySelectorAll('.card').forEach(card => {
        card.style.borderTop = '';
        card.style.borderBottom = '';
    });
    document.querySelectorAll('.drop-zone').forEach(zone => zone.remove());
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.querySelectorAll('.card-list').forEach(list => {
        // Запрещаем стандартное поведение при перетаскивании
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const target = e.target;
            const columnList = list; // Исправлено: используем list вместо this

            // Удаляем старые зоны сброса
            document.querySelectorAll('.drop-zone').forEach(zone => zone.remove());

            if (columnList.children.length === 0) {
                // Если в колонке нет карточек — создаём зону сброса по центру
                createDropZone(columnList, 0);
            } else if (target.classList.contains('card')) {
                // Если наводим на карточку — создаём зоны до/после
                const rect = target.getBoundingClientRect();
                const y = e.clientY - rect.top;

                if (y < rect.height / 2) {
                    // Зона перед карточкой
            createDropZone(columnList, Array.from(columnList.children).indexOf(target));
        } else {
            // Зона после карточки
            createDropZone(columnList, Array.from(columnList.children).indexOf(target) + 1);
        }
            }
        });

        // Обработка сброса карточки
        list.addEventListener('drop', e => {
            e.preventDefault();

            if (!draggedCard) return;

            const toColumnId = parseInt(list.closest('.column').dataset.columnId);
            const state = loadState();

            // Находим колонки
            const fromColumn = state.columns.find(col => col.id === draggedFromColumnId);
            const toColumn = state.columns.find(col => col.id === toColumnId);

            if (!fromColumn || !toColumn) return;

            // Удаляем карточку из исходной колонки
            const movedCard = fromColumn.cards.splice(draggedCardIndex, 1)[0];

            // Определяем позицию вставки
            let insertIndex = 0;
            const dropZones = list.querySelectorAll('.drop-zone');

            if (dropZones.length > 0) {
                insertIndex = parseInt(dropZones[0].dataset.position);
            } else {
                // Резервный вариант — в конец колонки
                insertIndex = toColumn.cards.length;
            }

            // Вставляем карточку в новую позицию
            toColumn.cards.splice(insertIndex, 0, movedCard);

            // Сбрасываем зоны сброса
            resetDropZones();

            saveState(state);
            renderBoard();
        });
    });
}

// Создание визуальной зоны сброса
function createDropZone(parent, position) {
    // Сначала удаляем все существующие зоны
    document.querySelectorAll('.drop-zone').forEach(zone => zone.remove());

    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.dataset.position = position;
    dropZone.textContent = 'Отпустите здесь';

    // Вставляем в нужную позицию
    const children = Array.from(parent.children);
    if (position < children.length) {
        parent.insertBefore(dropZone, children[position]);
    } else {
        parent.appendChild(dropZone);
    }
}
