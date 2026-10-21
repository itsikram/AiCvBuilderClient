import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sectionHasContent, type SectionId } from "@/lib/resume/model";
import type { ResumeContent } from "@/types";
import { EditorSection } from "./fields";

interface Props {
  order: SectionId[];
  onChange: (order: SectionId[]) => void;
  content: ResumeContent;
}

function Row({ id, index, total, empty, move }: { id: SectionId; index: number; total: number; empty: boolean; move: (from: number, to: number) => void }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const name = t(`cv.sections.${id}`);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1 rounded-lg border bg-background py-1 pl-1 pr-1", isDragging && "relative z-10 shadow-lg ring-2 ring-primary", empty && "opacity-60")}
    >
      <button
        type="button"
        className="flex h-10 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing"
        aria-label={t("editor.drag", { name })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm">
        {name}
        {empty && <span className="ml-2 text-xs text-muted">({t("editor.order.empty")})</span>}
      </span>
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`${t("editor.moveUp")}: ${name}`}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={index === total - 1} onClick={() => move(index, index + 1)} aria-label={`${t("editor.moveDown")}: ${name}`}>
        <ArrowDown className="h-4 w-4" />
      </Button>
    </li>
  );
}

/** Drag (mouse, touch or keyboard: Space then arrows) or use the arrows to reorder CV sections. */
export function SectionOrder({ order, onChange, content }: Props) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const move = (from: number, to: number) => onChange(arrayMove(order, from, to));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(order.indexOf(active.id as SectionId), order.indexOf(over.id as SectionId));
  };

  return (
    <EditorSection id="sec-order" title={t("editor.order.title")} hint={t("editor.order.hint")}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => t(`cv.sections.${active.id}`),
            onDragOver: ({ active, over }) => (over ? t("editor.order.moved", { name: t(`cv.sections.${active.id}`), position: order.indexOf(over.id as SectionId) + 1 }) : ""),
            onDragEnd: ({ active, over }) => (over ? t("editor.order.moved", { name: t(`cv.sections.${active.id}`), position: order.indexOf(over.id as SectionId) + 1 }) : ""),
            onDragCancel: () => "",
          },
        }}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="space-y-1.5">
            {order.map((id, index) => (
              <Row key={id} id={id} index={index} total={order.length} empty={!sectionHasContent(id, content)} move={move} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </EditorSection>
  );
}
