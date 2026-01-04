'use client';

import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';

interface ItemActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  onEdit: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export function ItemActionsSheet({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  onEdit,
  buttonRef,
}: ItemActionsSheetProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const handleEdit = () => {
    onClose();
    onEdit();
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${itemTitle}" and all its history?`)) {
      await itemsRepo.delete(itemId);
      onClose();
      router.replace('/');
    }
  };

  // Calculate position when menu opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, buttonRef]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, buttonRef]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Popup Menu */}
      <div
        ref={menuRef}
        className={clsx(
          "fixed z-50 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg",
          "transition-all duration-200 ease-out flex flex-col min-w-[160px]",
          isOpen 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
        }}
      >
        <button
          onClick={handleEdit}
          className="w-full text-left px-4 py-3 rounded-t-xl transition-colors text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 flex items-center gap-3"
        >
          <Edit size={18} className="text-gray-500 dark:text-gray-400" />
          <span className="font-medium">Edit</span>
        </button>
        <button
          onClick={handleDelete}
          className="w-full text-left px-4 py-3 rounded-b-xl transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 flex items-center gap-3"
        >
          <Trash2 size={18} className="text-red-600 dark:text-red-400" />
          <span className="font-medium">Delete</span>
        </button>
      </div>
    </>
  );
}

