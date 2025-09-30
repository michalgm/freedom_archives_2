import { useLayoutEffect, useRef, useState } from "react";

const DEFAULT_MAX_LINES = 3;

function useExpandableText({ textRef, expand = false, maxLines = DEFAULT_MAX_LINES }) {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [maxHeight, setMaxHeight] = useState("auto");
    const resizeObserverRef = useRef(null);

    useLayoutEffect(() => {
        // Early return if expand is false - skip all observer logic
        if (!expand) {
            // Clean up any existing observer
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
            return;
        }

        const element = textRef.current;
        if (!element) return;

        // Clean up existing observer
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }

        const checkOverflow = () => {
            if (element && element.isConnected) {
                requestAnimationFrame(() => {
                    const newIsOverflowing = element.scrollHeight > element.clientHeight;
                    setIsOverflowing(newIsOverflowing);
                });
            }
        };

        // Initial check
        setTimeout(checkOverflow, 0);

        // Create new observer
        resizeObserverRef.current = new ResizeObserver((entries) => {
            // Only trigger if the element actually changed size
            const entry = entries[0];
            if (entry && entry.target === element) {
                checkOverflow();
            }
        });

        resizeObserverRef.current.observe(element);

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
        };
    }, [expand, textRef, isExpanded]);

    // Separate effect to set maxHeight for animation (only when expanding)
    useLayoutEffect(() => {
        // Early return if expand is false - skip animation logic
        if (!expand) return;

        const element = textRef.current;
        if (!element) return;

        // When expanding, set maxHeight to natural height for smooth animation
        requestAnimationFrame(() => {
            const naturalHeight = element.scrollHeight;
            setMaxHeight(naturalHeight);
        });
    }, [expand, textRef, isExpanded]);


    const styles = {
        transition: "0.3s",
        textOverflow: "ellipsis",
        WebkitLineClamp: "unset",
        maxHeight: maxHeight,
        overflow: "hidden",
        ...(expand && !isExpanded ? {
            display: "-webkit-box",
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: "vertical",
            maxHeight: `calc(${maxLines} * 1lh)`,
        } : {})
    }

    return { isOverflowing, isExpanded, setIsExpanded, maxHeight, styles };
}

export default useExpandableText;