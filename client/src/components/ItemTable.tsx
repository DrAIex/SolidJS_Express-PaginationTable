import { createSignal, For, onMount, Show, createMemo } from 'solid-js';
import { DragDropProvider, DragDropSensors, DragOverlay, SortableProvider, createSortable, closestCenter, transformStyle } from '@thisbeyond/solid-dnd';
import { FiSearch, FiX } from 'solid-icons/fi';
import { BsGripVertical } from 'solid-icons/bs';
import { FaSolidCheck } from 'solid-icons/fa';
import { getItems, saveSelection, saveOrder, getSettings } from '../api';
import { Item } from '../types';
import '../styles/ItemTable.css';

const PAGE_SIZE = 20;

const ItemTable = () => {
  const [items, setItems] = createSignal<Item[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [page, setPage] = createSignal(1);
  const [hasMore, setHasMore] = createSignal(true);
  const [search, setSearch] = createSignal('');
  const [searchTimeout, setSearchTimeout] = createSignal<number | null>(null);
  const [selectedIds, setSelectedIds] = createSignal<Set<number>>(new Set());
  const [activeItem, setActiveItem] = createSignal<Item | null>(null);
  const [totalItems, setTotalItems] = createSignal(0);
  const [isScrollLoading, setIsScrollLoading] = createSignal(false);

  const fetchItems = async (newPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Загружаем элементы: страница ${newPage}, поиск: "${search()}", добавление: ${append}`);
      const data = await getItems(newPage, PAGE_SIZE, search());
      console.log(`Получено ${data.items.length} элементов, всего: ${data.totalItems}`);
      
      if (append) {
        setItems([...items(), ...data.items]);
      } else {
        setItems(data.items);
      }
      setPage(data.currentPage);
      setHasMore(data.hasMore);
      setTotalItems(data.totalItems);
    } catch (e) {
      console.error('Ошибка при загрузке элементов:', e);
      setError(`Ошибка при загрузке элементов: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
      setIsScrollLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      console.log('Загружаем настройки с сервера...');
      const settings = await getSettings();
      console.log('Настройки загружены:', settings);
      
      if (settings.selectedIds && settings.selectedIds.length > 0) {
        setSelectedIds(new Set(settings.selectedIds));
      }
      
      console.log('Инициализируем загрузку элементов...');
      await fetchItems(1, false);
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      setError(`Ошибка при загрузке настроек: ${error instanceof Error ? error.message : String(error)}`);
      
      await fetchItems(1, false);
    }
  };

  const handleSearchChange = (e: any) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout()) {
      window.clearTimeout(searchTimeout()!);
    }
    setSearchTimeout(
      window.setTimeout(() => {
        setPage(1);
        fetchItems(1, false);
      }, 300)
    );
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    fetchItems(1, false);
  };

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    if (
      !loading() &&
      !isScrollLoading() &&
      hasMore() &&
      target.scrollHeight - target.scrollTop <= target.clientHeight + 200
    ) {
      setIsScrollLoading(true);
      const nextPage = page() + 1;
      setPage(nextPage);
      fetchItems(nextPage, true);
    }
  };

  const toggleSelectItem = async (id: number) => {
    const newSelectedIds = new Set(selectedIds());
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
    try {
      await saveSelection(Array.from(newSelectedIds));
    } catch (error) {
      console.error('Ошибка при сохранении выбранных элементов:', error);
    }
  };

  const onDragStart = ({ draggable }: any) => {
    const id = Number(draggable.id);
    const draggedItem = items().find(item => item.id === id);
    if (draggedItem) {
      setActiveItem(draggedItem);
    }
  };

  const onDragEnd = async ({ draggable, droppable }: any) => {
    if (draggable && droppable) {
      const fromId = Number(draggable.id);
      const toId = Number(droppable.id);
      const fromIndex = items().findIndex((item) => item.id === fromId);
      const toIndex = items().findIndex((item) => item.id === toId);
      
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        const newItems = [...items()];
        const [movedItem] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, movedItem);
        setItems(newItems);
        
        try {
          console.log(`Перемещаем элемент ${fromId} к элементу ${toId}`);
          await saveOrder(
            newItems.map(item => item.id),
            { fromId, toId }
          );
          console.log('Порядок сохранен, перезагружаем текущую страницу');
          fetchItems(page(), false);
        } catch (error) {
          console.error('Ошибка при сохранении порядка:', error);
        }
      }
    }
    setActiveItem(null);
  };

  onMount(() => {
    console.log('Компонент ItemTable инициализирован');
    setSearch('');
    setPage(1);
    fetchSettings()
      .catch(err => {
        console.error('Ошибка при инициализации компонента:', err);
        setError(`Ошибка при инициализации: ${err instanceof Error ? err.message : String(err)}`);
      });
  });

  const SortableItem = (props: { item: Item }) => {
    const sortable = createSortable(props.item.id.toString());
    return (
      <tr
        ref={sortable.ref}
        class="table-row"
        classList={{
          'selected': props.item.selected,
          'dragging': sortable.isActiveDraggable
        }}
        style={transformStyle(sortable.transform)}
      >
        <td class="checkbox-cell">
          <div class="checkbox" onClick={() => toggleSelectItem(props.item.id)}>
            <Show when={props.item.selected}>
              <FaSolidCheck />
            </Show>
          </div>
        </td>
        <td class="drag-handle-cell">
          <div class="drag-handle" title="Перетащите для изменения порядка" {...sortable.dragActivators}>
            <BsGripVertical />
          </div>
        </td>
        <td>{props.item.id}</td>
        <td>{props.item.value}</td>
      </tr>
    );
  };

  return (
    <div class="item-table-container">
      <div class="table-header">
        <h1>Таблица с пагинацией</h1>
        <div class="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Поиск..."
            value={search()}
            onInput={handleSearchChange}
          />
          <Show when={search().length > 0}>
            <button class="clear-search-btn" onClick={clearSearch} title="Очистить поиск">
              <FiX />
            </button>
          </Show>
        </div>
        <div class="table-info">
          Всего элементов: {totalItems()} | Выбрано: {selectedIds().size}
        </div>
      </div>
      
      <Show when={error()}>
        <div class="error-message">
          {error()}
        </div>
      </Show>
      
      <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
        <DragDropSensors />
        <div class="table-wrapper" onScroll={handleScroll}>
          <Show when={items().length === 0 && !loading()}>
            <div class="empty-message">
              {search() ? 'Ничего не найдено по вашему запросу' : 'Список элементов пуст'}
            </div>
          </Show>
          
          <Show when={items().length > 0}>
            <table class="item-table">
              <thead>
                <tr>
                  <th width="50">Выбор</th>
                  <th width="50" title="Перетащите строки для изменения порядка">Порядок</th>
                  <th width="100">ID</th>
                  <th>Значение</th>
                </tr>
              </thead>
              <tbody>
                <SortableProvider ids={items().map(item => item.id.toString())}>
                  <For each={items()}>
                    {(item) => <SortableItem item={item} />}
                  </For>
                </SortableProvider>
              </tbody>
            </table>
          </Show>
          
          <Show when={loading() && items().length === 0}>
            <div class="loading-indicator">Загрузка элементов...</div>
          </Show>
          
          <Show when={isScrollLoading()}>
            <div class="loading-indicator">Загрузка...</div>
          </Show>
        </div>
        <DragOverlay>
          <Show when={activeItem()}>
            {(activeItem) => (
              <table class="item-table overlay-table">
                <tbody>
                  <tr class="dragging">
                    <td class="checkbox-cell">
                      <div class="checkbox">
                        <Show when={activeItem().selected}>
                          <FaSolidCheck />
                        </Show>
                      </div>
                    </td>
                    <td class="drag-handle-cell">
                      <div class="drag-handle">
                        <BsGripVertical />
                      </div>
                    </td>
                    <td>{activeItem().id}</td>
                    <td>{activeItem().value}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </Show>
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
};

export default ItemTable; 