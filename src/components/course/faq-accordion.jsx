import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqAccordion({ items, className }) {
  return (
    <Accordion type="single" collapsible className={className}>
      {items.map((f, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-base">{f.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">{f.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
