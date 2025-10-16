#!/usr/bin/env python3
"""
Golden Test Dataset for Dream Interpretation RAG
Curated test cases with ground truth interpretations
"""

import json
from typing import List, Dict
from dataclasses import dataclass, asdict

@dataclass
class DreamTestCase:
    """Test case for dream interpretation"""
    id: str
    dream_text: str
    user_context: Dict
    ground_truth_interpretation: str
    expected_symbols: List[str]
    expected_themes: List[str]
    difficulty: str  # "easy", "medium", "hard"
    category: str
    reference_sources: List[str]

class GoldenDataset:
    """Golden dataset manager"""

    def __init__(self):
        self.test_cases = self._create_test_cases()

    def _create_test_cases(self) -> List[DreamTestCase]:
        """Create curated test cases"""
        return [
            # Test Case 1: Classic anxiety dream
            DreamTestCase(
                id="TC001",
                dream_text="""I dreamed that my teeth were falling out one by one. I was at work
                during an important meeting and trying to catch them as they fell into my hands.
                I felt panicked and embarrassed. Everyone around me was staring but no one said anything.""",
                user_context={
                    "stress_level": "high",
                    "emotional_state": "anxious",
                    "recent_events": "Upcoming job performance review"
                },
                ground_truth_interpretation="""This dream likely reflects anxiety and concerns about
                loss of control or power in a professional setting. The teeth falling out is a common
                anxiety dream motif, often associated with feelings of powerlessness, loss of confidence,
                or fears about one's appearance or competence. The work setting and performance review
                context suggest concerns about professional evaluation and self-presentation. Research
                from Hall & Van de Castle shows teeth dreams correlate strongly with anxiety and stress.""",
                expected_symbols=["teeth", "falling", "work", "meeting", "embarrassment", "panic"],
                expected_themes=["anxiety", "loss of control", "professional stress", "self-image"],
                difficulty="easy",
                category="anxiety",
                reference_sources=["Hall & Van de Castle content analysis", "Contemporary anxiety research"]
            ),

            # Test Case 2: Flying dream
            DreamTestCase(
                id="TC002",
                dream_text="""I was flying above my hometown, soaring over houses and trees.
                The sensation was incredible - I felt completely free and in control. I could go
                anywhere I wanted just by thinking about it. The sky was bright blue and everything
                below looked peaceful.""",
                user_context={
                    "stress_level": "low",
                    "emotional_state": "excited",
                    "recent_events": "Just got accepted to dream university"
                },
                ground_truth_interpretation="""Flying dreams often represent feelings of freedom,
                empowerment, and transcendence of limitations. The controlled, positive nature of this
                flying experience suggests confidence and optimism. Research indicates flying dreams
                correlate with positive emotional states and feelings of mastery. The recent acceptance
                to university provides context for feelings of achievement and expanded possibilities.
                The dreamer's ability to control flight direction represents a sense of agency and
                self-determination.""",
                expected_symbols=["flying", "hometown", "sky", "freedom", "control"],
                expected_themes=["freedom", "empowerment", "achievement", "optimism"],
                difficulty="easy",
                category="positive",
                reference_sources=["Lucid dreaming research", "Positive psychology studies"]
            ),

            # Test Case 3: Water dream
            DreamTestCase(
                id="TC003",
                dream_text="""I was swimming in a vast, dark ocean. The water felt heavy and I was
                struggling to stay afloat. Waves kept crashing over my head and I couldn't see the shore.
                I felt exhausted and scared, but I kept swimming. Eventually I saw a small light in
                the distance.""",
                user_context={
                    "stress_level": "high",
                    "emotional_state": "overwhelmed",
                    "recent_events": "Dealing with family crisis and financial problems"
                },
                ground_truth_interpretation="""Water dreams often symbolize emotions and the unconscious mind.
                The dark, overwhelming ocean represents feeling emotionally overwhelmed by current life
                circumstances. The struggle to stay afloat mirrors the effort to cope with multiple stressors
                (family crisis and financial problems). The exhaustion and fear reflect genuine emotional state.
                The distant light suggests hope or the possibility of resolution. Research on dream content
                shows water dreams frequently appear during periods of emotional turmoil and often reflect the
                dreamer's emotional regulation efforts.""",
                expected_symbols=["ocean", "water", "swimming", "waves", "darkness", "light", "struggle"],
                expected_themes=["emotional overwhelm", "coping", "persistence", "hope"],
                difficulty="medium",
                category="stress",
                reference_sources=["Cartwright mood regulation research", "Emotional processing studies"]
            ),

            # Test Case 4: Chase dream
            DreamTestCase(
                id="TC004",
                dream_text="""Something was chasing me through a dark forest. I couldn't see what it was,
                but I knew it was dangerous. I kept running but my legs felt heavy like I was moving through
                mud. I tried to scream but no sound came out. Finally I found a small cabin and locked myself
                inside.""",
                user_context={
                    "stress_level": "high",
                    "emotional_state": "anxious",
                    "recent_events": "Avoiding difficult conversation with partner"
                },
                ground_truth_interpretation="""Chase dreams typically represent avoidance of something in
                waking life. The inability to see the pursuer often indicates the threat is not fully
                understood or acknowledged. The heavy legs and inability to scream are classic dream paralysis
                experiences reflecting feelings of powerlessness. The dark forest represents confusion or lack
                of clarity. The context of avoiding a difficult conversation suggests the dream reflects anxiety
                about confrontation. The cabin may represent desire for safety or escape. Threat simulation
                theory suggests chase dreams may be evolutionary adaptations for rehearsing escape responses.""",
                expected_symbols=["chase", "forest", "darkness", "running", "paralysis", "hiding", "cabin"],
                expected_themes=["avoidance", "fear", "powerlessness", "confrontation anxiety"],
                difficulty="medium",
                category="anxiety",
                reference_sources=["Threat simulation theory", "Dream paralysis research"]
            ),

            # Test Case 5: House dream
            DreamTestCase(
                id="TC005",
                dream_text="""I was in my childhood home, but it was different - there were extra rooms
                I'd never seen before. Some rooms were beautiful and bright, others were dark and dusty.
                I kept discovering new spaces. In one room I found old photographs of family members I'd
                forgotten about.""",
                user_context={
                    "stress_level": "medium",
                    "emotional_state": "nostalgic",
                    "recent_events": "Recently started therapy to work on childhood issues"
                },
                ground_truth_interpretation="""Houses in dreams often represent the self or psyche.
                The childhood home specifically relates to early life experiences and foundational aspects
                of identity. Discovering new rooms suggests exploring previously unexamined aspects of self,
                which aligns with beginning therapy. The varied conditions of rooms (bright vs. dark and dusty)
                may represent different emotional states or memories - some positive, others neglected or
                painful. Finding forgotten family photographs suggests recovering or re-examining childhood
                memories. This dream appears to reflect the psychological exploration process initiated by
                therapy.""",
                expected_symbols=["house", "childhood home", "rooms", "photographs", "family", "discovery"],
                expected_themes=["self-exploration", "memory", "therapy process", "identity"],
                difficulty="hard",
                category="psychological",
                reference_sources=["Jungian house symbolism", "Memory consolidation research"]
            ),

            # Test Case 6: Exam/test dream
            DreamTestCase(
                id="TC006",
                dream_text="""I was back in school taking a final exam, but I hadn't studied at all.
                I didn't even know what class it was for. Everyone else was writing furiously while I
                sat there with a blank paper. The clock was ticking loudly. I felt unprepared and
                stupid.""",
                user_context={
                    "stress_level": "high",
                    "emotional_state": "stressed",
                    "recent_events": "Big project deadline at work, feeling unprepared"
                },
                ground_truth_interpretation="""Test or exam dreams are among the most common anxiety dreams,
                particularly among adults long out of school. They typically represent feelings of being
                evaluated, judged, or tested in waking life. The unpreparedness theme directly mirrors the
                work situation. Not knowing what class represents uncertainty about expectations or
                requirements. Others writing while the dreamer sits with a blank page suggests comparison
                with colleagues and feelings of inadequacy. The ticking clock represents deadline pressure.
                Hall & Van de Castle research shows such dreams peak during periods of performance evaluation
                or high responsibility.""",
                expected_symbols=["exam", "school", "unprepared", "blank paper", "clock", "others writing"],
                expected_themes=["performance anxiety", "unpreparedness", "evaluation fear", "deadline pressure"],
                difficulty="easy",
                category="anxiety",
                reference_sources=["Hall & Van de Castle", "Performance anxiety research"]
            ),

            # Test Case 7: Falling dream
            DreamTestCase(
                id="TC007",
                dream_text="""I was standing on the edge of a tall building looking down. Suddenly I
                lost my balance and started falling. The ground was rushing up toward me. I felt my
                stomach drop and complete terror. Just before hitting the ground, I jolted awake with
                my heart racing.""",
                user_context={
                    "stress_level": "high",
                    "emotional_state": "anxious",
                    "recent_events": "Made a big mistake at work, worried about consequences"
                },
                ground_truth_interpretation="""Falling dreams are universal and often relate to loss of
                control or fear of failure. The tall building suggests a position or status, and the fall
                may represent fear of losing it. The context of a work mistake provides clear connection -
                the dreamer fears "falling" from their professional position or standing. The jolt awake
                (hypnic jerk) is a normal physiological response. Research shows falling dreams correlate
                with anxiety about situations where one feels out of control or fears negative consequences.
                The terror felt represents genuine concern about the situation's outcome.""",
                expected_symbols=["falling", "building", "height", "ground", "terror", "loss of control"],
                expected_themes=["fear of failure", "loss of control", "consequences", "status anxiety"],
                difficulty="easy",
                category="anxiety",
                reference_sources=["Hypnic jerk research", "Control and anxiety studies"]
            ),

            # Test Case 8: Complex symbolic dream
            DreamTestCase(
                id="TC008",
                dream_text="""I was in a garden tending to plants, but every time I watered one plant,
                another would wilt. There was a snake coiled around the garden hose. A crow kept landing
                on my shoulder and cawing. In the distance, I could hear someone calling my name but I
                couldn't see who it was. The sun was setting and I felt I needed to finish before dark.""",
                user_context={
                    "stress_level": "high",
                    "emotional_state": "overwhelmed",
                    "recent_events": "Trying to balance multiple responsibilities - work, family, aging parents"
                },
                ground_truth_interpretation="""This complex dream uses multiple symbols to represent the
                dreamer's situation of managing competing demands. The garden represents responsibilities
                or life areas requiring care and attention. The zero-sum nature of watering (one plant
                thrives, another wilts) symbolizes the impossible balancing act of multiple responsibilities.
                The snake coiled around the hose may represent obstacles or threats to the dreamer's ability
                to nurture these areas. The crow could symbolize warnings or messages being ignored. The
                distant voice calling suggests someone's needs are being neglected. The approaching darkness
                and time pressure represent the urgency and stress of the situation. This dream reflects the
                cognitive and emotional load of caregiving and multiple role obligations.""",
                expected_symbols=["garden", "plants", "water", "snake", "crow", "voice", "sunset", "time pressure"],
                expected_themes=["competing demands", "caregiver stress", "resource limitation", "time pressure", "balance"],
                difficulty="hard",
                category="complex_stress",
                reference_sources=["Multi-role stress research", "Symbolic dream analysis", "Caregiver burden studies"]
            ),

            # Test Case 9: Death dream
            DreamTestCase(
                id="TC009",
                dream_text="""I dreamed I was at my own funeral. I could see myself in the casket and
                watch people walking past. Some were crying, others seemed relieved. I wanted to tell
                everyone I wasn't really dead, but I couldn't speak or move. I felt sad but also strangely
                peaceful.""",
                user_context={
                    "stress_level": "medium",
                    "emotional_state": "reflective",
                    "recent_events": "Recently turned 40, thinking about life direction and purpose"
                },
                ground_truth_interpretation="""Despite the macabre content, dreams of one's own death
                rarely predict actual death and more commonly represent transformation, endings, or major
                life transitions. At 40, this dream likely reflects midlife reflection and the "death" of
                one identity or life phase as another begins. Observing others' reactions may represent
                concerns about one's impact on others or legacy. The inability to communicate suggests
                feeling unheard or misunderstood in waking life. The mixed emotions (sad but peaceful)
                reflect the bittersweet nature of major transitions - loss of the familiar but acceptance
                of change. This aligns with research showing death dreams often appear during significant
                life transitions.""",
                expected_symbols=["death", "funeral", "casket", "observers", "inability to speak", "peace"],
                expected_themes=["transformation", "midlife transition", "legacy concerns", "acceptance"],
                difficulty="hard",
                category="transition",
                reference_sources=["Transformation symbolism", "Midlife transition research", "Death dream studies"]
            ),

            # Test Case 10: Lucid/control dream
            DreamTestCase(
                id="TC010",
                dream_text="""I realized I was dreaming and suddenly had control over everything. I
                decided to fly and immediately lifted off the ground. I flew to the beach and made the
                weather perfect. Then I decided to meet someone I admire and they appeared. We had a long
                conversation. I felt powerful and creative.""",
                user_context={
                    "stress_level": "low",
                    "emotional_state": "confident",
                    "recent_events": "Completed major creative project successfully"
                },
                ground_truth_interpretation="""This is a lucid dream where the dreamer becomes aware they
                are dreaming and can exert control. Lucid dreaming correlates with metacognitive awareness
                and sometimes with creative or problem-solving success. The ability to manifest desired
                scenarios reflects feelings of agency and self-efficacy, supported by the recent successful
                project completion. The powerful and creative feelings in the dream mirror waking confidence.
                Research shows lucid dreams are more common during positive emotional states and can serve
                to consolidate feelings of mastery and competence. This dream appears to be integrating and
                reinforcing positive experiences and self-concept.""",
                expected_symbols=["lucidity", "flying", "beach", "weather control", "manifestation", "conversation"],
                expected_themes=["control", "creativity", "self-efficacy", "wish fulfillment", "positive state"],
                difficulty="medium",
                category="lucid",
                reference_sources=["Lucid dreaming research", "Metacognition studies", "Self-efficacy theory"]
            )
        ]

    def get_test_case(self, test_id: str) -> DreamTestCase:
        """Get specific test case by ID"""
        for case in self.test_cases:
            if case.id == test_id:
                return case
        return None

    def get_by_category(self, category: str) -> List[DreamTestCase]:
        """Get test cases by category"""
        return [case for case in self.test_cases if case.category == category]

    def get_by_difficulty(self, difficulty: str) -> List[DreamTestCase]:
        """Get test cases by difficulty"""
        return [case for case in self.test_cases if case.difficulty == difficulty]

    def save_to_json(self, filepath: str):
        """Save dataset to JSON file"""
        data = [asdict(case) for case in self.test_cases]
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(self.test_cases)} test cases to {filepath}")

    def load_from_json(self, filepath: str):
        """Load dataset from JSON file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.test_cases = [DreamTestCase(**case) for case in data]
        print(f"Loaded {len(self.test_cases)} test cases from {filepath}")

    def get_statistics(self) -> Dict:
        """Get dataset statistics"""
        categories = {}
        difficulties = {}

        for case in self.test_cases:
            categories[case.category] = categories.get(case.category, 0) + 1
            difficulties[case.difficulty] = difficulties.get(case.difficulty, 0) + 1

        return {
            "total_cases": len(self.test_cases),
            "categories": categories,
            "difficulties": difficulties
        }

def main():
    """Create and save golden dataset"""
    print("=" * 80)
    print("Creating Golden Test Dataset for Dream Interpretation")
    print("=" * 80)

    dataset = GoldenDataset()

    # Show statistics
    stats = dataset.get_statistics()
    print(f"\nDataset Statistics:")
    print(f"  Total test cases: {stats['total_cases']}")
    print(f"\n  By Category:")
    for cat, count in stats['categories'].items():
        print(f"    {cat}: {count}")
    print(f"\n  By Difficulty:")
    for diff, count in stats['difficulties'].items():
        print(f"    {diff}: {count}")

    # Save to file
    from pathlib import Path
    output_path = Path(__file__).parent / "golden_dataset.json"
    dataset.save_to_json(str(output_path))

    # Show sample case
    print(f"\n{'='*80}")
    print("Sample Test Case:")
    print(f"{'='*80}")
    sample = dataset.test_cases[0]
    print(f"\nID: {sample.id}")
    print(f"Category: {sample.category}")
    print(f"Difficulty: {sample.difficulty}")
    print(f"\nDream: {sample.dream_text[:200]}...")
    print(f"\nExpected Symbols: {', '.join(sample.expected_symbols)}")
    print(f"Expected Themes: {', '.join(sample.expected_themes)}")

    print(f"\n{'='*80}")
    print("Golden dataset created successfully!")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
