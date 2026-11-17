"""Generates placeholder course/internship thumbnails as SVG (demo only)."""
import os, html
items = {
 "full-stack-web-development": ("Full Stack Web Development", "#2563EB", "#14213D", "</>"),
 "digital-marketing-mastery": ("Digital Marketing Mastery", "#F5B544", "#B45309", "📣"),
 "python-for-data-analytics": ("Python for Data Analytics", "#0EA5E9", "#0F172A", "∑"),
 "seo-fundamentals-to-advanced": ("SEO: Fundamentals to Advanced", "#16A34A", "#14532D", "⌕"),
 "graphic-design-and-brand-identity": ("Graphic Design & Brand Identity", "#EC4899", "#831843", "✦"),
 "aws-cloud-and-devops-essentials": ("AWS Cloud & DevOps", "#F97316", "#7C2D12", "☁"),
 "java-programming-and-dsa": ("Java & Data Structures", "#EF4444", "#7F1D1D", "{ }"),
 "project-management-essentials": ("Project Management", "#8B5CF6", "#4C1D95", "▦"),
 "machine-learning-with-python": ("Machine Learning", "#06B6D4", "#164E63", "◉"),
 "social-media-marketing": ("Social Media Marketing", "#F43F5E", "#881337", "♥"),
 "linux-and-networking-fundamentals": ("Linux & Networking", "#64748B", "#1E293B", ">_"),
 "ui-ux-design-with-figma": ("UI/UX Design with Figma", "#A855F7", "#581C87", "▣"),
 "advanced-react-patterns": ("Advanced React Patterns", "#3B82F6", "#1E3A8A", "⚛"),
 "internship-engineering": ("Engineering Internship", "#2563EB", "#14213D", "</>"),
 "internship-marketing": ("Marketing Internship", "#F5B544", "#B45309", "📣"),
 "internship-analytics": ("Analytics Internship", "#0EA5E9", "#0F172A", "∑"),
 "internship-design": ("Design Internship", "#EC4899", "#831843", "✦"),
 "internship-cloud": ("Cloud Internship", "#F97316", "#7C2D12", "☁"),
}
for slug,(title,c1,c2,glyph) in items.items():
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.08)"/></pattern></defs>
<rect width="800" height="450" fill="url(#g)"/><rect width="800" height="450" fill="url(#grid)"/>
<circle cx="680" cy="90" r="160" fill="rgba(255,255,255,0.06)"/><circle cx="120" cy="400" r="110" fill="rgba(255,255,255,0.05)"/>
<text x="56" y="250" font-family="Inter, Arial, sans-serif" font-size="110" font-weight="700" fill="rgba(255,255,255,0.9)">{html.escape(glyph)}</text>
<text x="56" y="340" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600" fill="#fff">{html.escape(title)}</text>
<text x="56" y="384" font-family="Inter, Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.75)" letter-spacing="3">AUCTECH ACADEMY</text>
</svg>'''
    open(f"public/thumbnails/{slug}.svg","w").write(svg)
print("generated", len(items))
