type LandingFeatureCardProps = {
  kicker: string;
  title: string;
  text: string;
};

export default function LandingFeatureCard({ kicker, title, text }: LandingFeatureCardProps) {
  return (
    <article className="bg-bg-card border border-[#EFE2D0] rounded-3xl p-5 shadow-[0_12px_28px_rgba(45,36,36,0.04)]">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-text-main text-orange-50 font-black mb-3">
        {kicker}
      </div>
      <h2 className="m-0 mb-2 text-text-main text-[1.15rem] font-bold">{title}</h2>
      <p className="m-0 text-text-muted leading-relaxed">{text}</p>
    </article>
  );
}