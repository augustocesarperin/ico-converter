import { useEffect, useRef } from "react";

interface AdSlotProps {
	provider?: "adsense" | "carbon" | "ethical" | "none";
	className?: string;
}

const AdSlot = ({ provider = (import.meta.env.VITE_ADS_PROVIDER as AdSlotProps["provider"]) || "none", className = "" }: AdSlotProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!import.meta.env.PROD || !ref.current) return;
		if (provider === "none") return;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (!e.isIntersecting) return;
				observer.disconnect();

				if (provider === "adsense") {
					const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
					const slot = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;
					if (!client || !slot) return;
					const s = document.createElement("script");
					s.async = true;
					s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
					s.crossOrigin = "anonymous";
					document.head.appendChild(s);

					const ins = document.createElement("ins");
					ins.className = "adsbygoogle";
					ins.style.display = "block";
					ins.style.minHeight = "130px";
					ins.setAttribute("data-ad-client", client);
					ins.setAttribute("data-ad-slot", slot);
					ins.setAttribute("data-full-width-responsive", "true");
					ref.current!.appendChild(ins);

					const run = () => {
						try {
							// @ts-expect-error adsbygoogle
							(window.adsbygoogle = window.adsbygoogle || []).push({});
						} catch {}
					};
					if ("requestIdleCallback" in window) {
						// @ts-expect-error requestIdleCallback
						window.requestIdleCallback(run);
					} else {
						setTimeout(run, 400);
					}
				}
			});
		}, { rootMargin: "200px 0px" });

		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [provider]);

	return (
		<div
			ref={ref}
			className={`mx-auto my-8 w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-black/50 p-2 ${className}`}
			aria-label="advertising"
			role="complementary"
		>
			{/* Skeleton to preserve layout; replaced when ad loads */}
			<div className="h-[130px] w-full animate-pulse rounded-lg bg-white/5" />
		</div>
	);
};

export default AdSlot;

