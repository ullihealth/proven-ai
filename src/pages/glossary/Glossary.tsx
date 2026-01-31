import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Input } from "@/components/ui/input";
import { Search, Clock } from "lucide-react";
import { glossaryTerms, getAlphabetIndex, getTermsByLetter, GlossaryTerm } from "@/data/glossaryData";
import { cn } from "@/lib/utils";

const GlossaryTermCard = ({ term }: { term: GlossaryTerm }) => {
  return (
    <div className="py-5 border-b border-border last:border-b-0">
      <h3 className="text-lg font-semibold text-foreground mb-2">{term.term}</h3>
      <p className="text-pai-text-secondary leading-relaxed">{term.definition}</p>
      
      {term.whyItMatters && (
        <p className="mt-3 text-sm text-pai-text-muted">
          <span className="font-medium text-foreground">Why it matters:</span> {term.whyItMatters}
        </p>
      )}
      
      {term.seeAlso && term.seeAlso.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-pai-text-muted">See also:</span>
          {term.seeAlso.map((relatedId) => {
            const relatedTerm = glossaryTerms.find(t => t.id === relatedId);
            return relatedTerm ? (
              <a
                key={relatedId}
                href={`#${relatedId}`}
                className="text-sm text-primary hover:underline"
              >
                {relatedTerm.term}
              </a>
            ) : null;
          })}
        </div>
      )}
      
      <div className="mt-3 flex items-center gap-1.5 text-xs text-pai-text-muted">
        <Clock className="h-3 w-3" />
        <span>Last reviewed: {term.lastReviewed}</span>
      </div>
    </div>
  );
};

const Glossary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const alphabetIndex = useMemo(() => getAlphabetIndex(), []);
  const termsByLetter = useMemo(() => getTermsByLetter(), []);
  
  const filteredTerms = useMemo(() => {
    let terms = glossaryTerms;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(term => 
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query)
      );
    }
    
    // Apply letter filter
    if (activeFilter) {
      terms = terms.filter(term => 
        term.term[0].toUpperCase() === activeFilter
      );
    }
    
    return terms;
  }, [searchQuery, activeFilter]);
  
  const handleLetterClick = (letter: string) => {
    if (activeFilter === letter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(letter);
      setSearchQuery("");
    }
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setActiveFilter(null);
  };

  return (
    <AppLayout>
      <PageHeader
        title="AI Glossary"
        description="Quick lookup of AI terms explained in plain English. No hype, just clarity."
      />
      
      {/* Search bar - mobile optimized */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pai-text-muted" />
        <Input
          type="text"
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActiveFilter(null);
          }}
          className="pl-12 h-12 text-base bg-card border-border"
        />
      </div>
      
      {/* A-Z Index - horizontal scroll on mobile */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1.5 min-w-max pb-2">
          <button
            onClick={clearFilters}
            className={cn(
              "min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors touch-manipulation",
              !activeFilter && !searchQuery
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-pai-text-secondary hover:text-foreground"
            )}
          >
            All
          </button>
          {alphabetIndex.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={cn(
                "min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors touch-manipulation",
                activeFilter === letter
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-pai-text-secondary hover:text-foreground"
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
      
      {/* Terms list */}
      <div className="bg-card rounded-lg border border-border">
        {filteredTerms.length > 0 ? (
          <div className="px-4 md:px-6">
            {filteredTerms.map((term) => (
              <div key={term.id} id={term.id}>
                <GlossaryTermCard term={term} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-pai-text-secondary">No terms found matching your search.</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-primary hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      {/* Results count */}
      <p className="mt-4 text-sm text-pai-text-muted text-center">
        Showing {filteredTerms.length} of {glossaryTerms.length} terms
      </p>
    </AppLayout>
  );
};

export default Glossary;
