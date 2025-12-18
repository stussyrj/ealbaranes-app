import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  "data-testid": testId,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => 
    suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    ),
    [suggestions, value]
  );

  const showSuggestions = isOpen && value.length > 0 && filteredSuggestions.length > 0;

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [showSuggestions, filteredSuggestions, highlightedIndex, handleSuggestionClick]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll("[data-suggestion]");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        data-testid={testId}
        autoComplete="off"
      />
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto"
          data-testid={testId ? `${testId}-suggestions` : undefined}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              data-suggestion
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover-elevate cursor-pointer",
                index === highlightedIndex && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
              data-testid={testId ? `${testId}-suggestion-${index}` : undefined}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
