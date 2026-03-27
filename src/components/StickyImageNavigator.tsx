import clsx from "clsx";
import { memo, useEffect, useMemo, useState } from "react";

import type { ConversionItem } from "@/types/conversion";

const itemAnchorId = (id: string) => `conversion-item-${id}`;

interface StickyImageNavigatorProps {
	items: Pick<ConversionItem, "id" | "file" | "originalUrl">[];
}

const StickyImageNavigatorComponent = ({ items }: StickyImageNavigatorProps) => {
	const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

	useEffect(() => {
		if (items.length === 0) {
			setActiveId(null);
			return;
		}

		const sections = items
			.map((item) => document.getElementById(itemAnchorId(item.id)))
			.filter((section): section is HTMLElement => Boolean(section));

		if (sections.length === 0) {
			setActiveId(items[0]?.id ?? null);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntries = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);

				if (visibleEntries.length === 0) return;

				const nextId = visibleEntries[0]?.target.getAttribute("data-conversion-id");
				if (nextId) {
					setActiveId(nextId);
				}
			},
			{
				rootMargin: "-20% 0px -55% 0px",
				threshold: [0.2, 0.4, 0.6, 0.8],
			},
		);

		for (const section of sections) {
			observer.observe(section);
		}

		return () => observer.disconnect();
	}, [items]);

	const entries = useMemo(
		() =>
			items.map((item, index) => ({
				id: item.id,
				name: item.file.name,
				originalUrl: item.originalUrl,
				label: `${index + 1}`,
			})),
		[items],
	);

	const handleScrollToItem = (id: string) => {
		const target = document.getElementById(itemAnchorId(id));
		target?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	if (items.length < 2) {
		return null;
	}

	return (
		<div className="sticky top-2 z-40 w-fit mx-auto">
			<div className="mx-auto max-w-6xl px-2">
				<div className="border border-border bg-surface/95 p-2 backdrop-blur-xs">
					<div className="flex gap-2 overflow-x-auto pb-1">
						{entries.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => handleScrollToItem(item.id)}
								title={item.name}
								className={clsx(
									"group relative shrink-0 overflow-hidden border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
									activeId === item.id
										? "border-accent bg-surface-strong"
										: "border-border bg-surface hover:border-accent/70 hover:bg-surface-muted",
								)}
							>
								<img
									src={item.originalUrl}
									alt={item.name}
									loading="lazy"
									className="h-16 w-16 object-cover"
								/>
								<span className="pointer-events-none absolute left-1 top-1 rounded bg-background/85 px-1.5 py-0.5 text-xs font-bold text-foreground">
									{item.label}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export const stickyImageAnchorId = itemAnchorId;

export const StickyImageNavigator = memo(StickyImageNavigatorComponent);
