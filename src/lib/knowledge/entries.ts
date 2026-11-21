import type { KnowledgeEntry } from "./types";

// Draft entries written by engineering from well-known published research.
// None is approved: a qualified reviewer must check the content, verify every
// citation against the original, and set review.status to "approved" with
// their name and date. See docs/knowledge/REVIEW.md.

const DRAFT = { status: "draft" as const, reviewer: null, reviewedOn: null };

export const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: "attachment-basics",
    title: "Attachment: how early care shapes expectations of closeness",
    keywords: ["attachment", "abandon", "abandoned", "trust people", "close to people", "push people away", "clingy", "needy", "left me"],
    evidence: "established",
    guidance:
      "Children build working expectations about whether others will be available and responsive, based on how caregivers responded to them. These expectations can carry into adult relationships as patterns, for example staying guarded, needing reassurance, or pulling away when things get close. Patterns are tendencies, not fixed traits: secure relationships later in life, reflection, and new experiences can change them.",
    caveats:
      "Offer this as a possibility he can test against his own experience, never as a label. Do not assign him an attachment 'style'. Do not imply his caregivers are to blame for everything.",
    sources: [
      { citation: "Bowlby, J. (1969). Attachment and Loss, Vol. 1: Attachment. Basic Books.", verified: false },
      { citation: "Ainsworth, M. D. S., Blehar, M. C., Waters, E., & Wall, S. (1978). Patterns of Attachment. Lawrence Erlbaum.", verified: false },
      { citation: "Hazan, C., & Shaver, P. (1987). Romantic love conceptualized as an attachment process. Journal of Personality and Social Psychology, 52(3), 511–524.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "adult-attachment-change",
    title: "Attachment patterns can shift in adulthood",
    keywords: ["always been this way", "can't change", "broken", "relationship pattern", "same mistakes", "why do i always"],
    evidence: "established",
    guidance:
      "Research on adult attachment finds that people's sense of security in relationships is moderately stable but can change, especially through consistently supportive relationships and deliberate reflection on old patterns. Noticing a pattern is often the first step to choosing differently.",
    caveats: "Encourage hope without promising a specific outcome or timeline.",
    sources: [
      { citation: "Mikulincer, M., & Shaver, P. R. (2016). Attachment in Adulthood: Structure, Dynamics, and Change (2nd ed.). Guilford Press.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "father-involvement-research",
    title: "What research says about fathers' involvement",
    keywords: ["father absence", "absent father", "dad wasn't around", "dad left", "fatherless", "no dad", "grew up without a father"],
    evidence: "established",
    guidance:
      "Reviews of studies find that engaged father involvement is associated with better social, behavioural and emotional outcomes for children, on average. Research on father absence shows associations with some later difficulties, but the causal picture is mixed: other factors such as household income, conflict, and instability explain part of the link. Many men who grew up without an involved father do well, and many difficulties have several causes.",
    caveats:
      "Never tell him his difficulties are caused by his father's absence. Use this to normalise his experience, not to explain his life. Do not present group averages as predictions about him.",
    sources: [
      { citation: "Sarkadi, A., Kristiansson, R., Oberklaid, F., & Bremberg, S. (2008). Fathers' involvement and children's developmental outcomes: a systematic review of longitudinal studies. Acta Paediatrica, 97(2), 153–158.", verified: false },
      { citation: "McLanahan, S., Tach, L., & Schneider, D. (2013). The causal effects of father absence. Annual Review of Sociology, 39, 399–427.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "emotional-neglect",
    title: "When a parent was present but emotionally unavailable",
    keywords: ["never talked", "didn't talk", "emotionally unavailable", "cold", "distant", "never said he loved", "never showed", "there but not there", "never hugged"],
    evidence: "emerging",
    guidance:
      "Some people grow up with a parent who was physically present but rarely acknowledged their feelings. Large studies of adverse childhood experiences include emotional neglect alongside other adversities. Clinicians describe common later experiences such as difficulty naming feelings or feeling unseen, though research on emotional neglect specifically is less developed than for other experiences. Learning to notice and name feelings is a skill that can be built at any age.",
    caveats:
      "Do not diagnose 'childhood emotional neglect'. Present the clinical descriptions as ideas some people find useful, not as established facts about him.",
    sources: [
      { citation: "Felitti, V. J., et al. (1998). Relationship of childhood abuse and household dysfunction to many of the leading causes of death in adults: the Adverse Childhood Experiences (ACE) Study. American Journal of Preventive Medicine, 14(4), 245–258.", verified: false },
      { citation: "Webb, J. (2012). Running on Empty: Overcome Your Childhood Emotional Neglect. Morgan James.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "naming-emotions",
    title: "Naming feelings helps regulate them",
    keywords: ["angry", "anger", "rage", "lose my temper", "lost my temper", "overwhelmed", "can't control", "snap", "blow up"],
    evidence: "established",
    guidance:
      "Emotion regulation research shows people can change how strongly they feel and act on emotions, for example by pausing, reframing a situation, or putting the feeling into words. Experiments find that simply labelling a feeling can reduce its intensity. A practical step is to pause and name the feeling in one word before responding.",
    caveats: "Offer techniques as things to try, not prescriptions. Anger that leads to harm needs the safety response, not a technique.",
    sources: [
      { citation: "Gross, J. J. (1998). The emerging field of emotion regulation: An integrative review. Review of General Psychology, 2(3), 271–299.", verified: false },
      { citation: "Lieberman, M. D., et al. (2007). Putting feelings into words: Affect labeling disrupts amygdala activity in response to affective stimuli. Psychological Science, 18(5), 421–428.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "thought-patterns",
    title: "Noticing and questioning harsh automatic thoughts",
    keywords: ["i'm a failure", "i always", "i never", "everyone thinks", "i'm useless", "i'm stupid", "not good enough", "worst"],
    evidence: "established",
    guidance:
      "Cognitive behavioural approaches observe that quick, harsh thoughts ('I always mess up') shape how we feel and act, and that examining the evidence for and against them can loosen their grip. CBT delivered by trained clinicians has strong research support for many conditions. In conversation, a gentle question such as 'What would you say to a friend who thought that about himself?' can help him step back.",
    caveats:
      "This is not therapy and must not be presented as CBT treatment. If thoughts are persistent and heavy, suggest speaking with a professional.",
    sources: [
      { citation: "Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). Cognitive Therapy of Depression. Guilford Press.", verified: false },
      { citation: "Hofmann, S. G., et al. (2012). The efficacy of cognitive behavioral therapy: A review of meta-analyses. Cognitive Therapy and Research, 36(5), 427–440.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "self-compassion",
    title: "Self-compassion is not weakness",
    keywords: ["hate myself", "so hard on myself", "beat myself up", "weak", "soft", "pathetic", "ashamed"],
    evidence: "emerging",
    guidance:
      "Self-compassion means treating yourself with the understanding you'd offer a friend: noticing struggle, remembering everyone struggles, and responding kindly rather than harshly. Studies associate it with lower depression and anxiety, and it tends to go with taking responsibility rather than avoiding it. Many men are taught that being hard on themselves is strength; the research suggests steadiness grows more from understanding than from self-attack.",
    caveats: "Most evidence is correlational. Frame as worth trying, and stay respectful of men who find the word 'compassion' uncomfortable.",
    sources: [
      { citation: "Neff, K. D. (2003). Self-compassion: An alternative conceptualization of a healthy attitude toward oneself. Self and Identity, 2(2), 85–101.", verified: false },
      { citation: "MacBeth, A., & Gumley, A. (2012). Exploring compassion: A meta-analysis of the association between self-compassion and psychopathology. Clinical Psychology Review, 32(6), 545–552.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "small-steps",
    title: "Small, specific steps beat big intentions",
    keywords: ["can't get started", "procrastinat", "stuck", "no motivation", "unmotivated", "keep putting off", "where do i start"],
    evidence: "established",
    guidance:
      "Planning a small, specific action tied to a when and where ('After dinner on Tuesday I'll walk for ten minutes') makes people much more likely to follow through than a general intention. Scheduling small rewarding or meaningful activities is also an established approach for lifting low mood. Momentum tends to follow action, not the other way round.",
    caveats: "Keep suggested steps small and optional. Persistent low mood deserves a professional's input.",
    sources: [
      { citation: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69–119.", verified: false },
      { citation: "Ekers, D., et al. (2014). Behavioural activation for depression; an update of meta-analysis of effectiveness and sub group analysis. PLoS ONE, 9(6), e100100.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "assertive-boundaries",
    title: "Saying what you need, calmly and directly",
    keywords: ["boundary", "boundaries", "say no", "people pleaser", "pushover", "walk all over me", "stand up for myself"],
    evidence: "emerging",
    guidance:
      "Assertiveness means stating your needs and limits clearly and respectfully, without attacking or giving in. Assertiveness training has research support, though the literature is older and less extensive than for some approaches. A useful shape is: what happened, how it affects you, and what you're asking for, in one or two calm sentences.",
    caveats: "Never encourage confronting someone who may be dangerous; safety comes first.",
    sources: [
      { citation: "Speed, B. C., Goldstein, B. L., & Goldfried, M. R. (2018). Assertiveness training: A forgotten evidence-based treatment. Clinical Psychology: Science and Practice, 25(1), e12216.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "social-connection",
    title: "Connection with other people protects health",
    keywords: ["lonely", "alone", "no friends", "isolated", "nobody to talk to", "lost touch", "friends"],
    evidence: "established",
    guidance:
      "A large meta-analysis found that people with stronger social relationships had a markedly higher likelihood of survival over the study periods, an effect comparable to well-known health risks. Many men's friendships fade with work and family demands. Reaching out first, keeping small regular contact, and doing things side by side are practical ways to rebuild connection.",
    caveats: "Use this to encourage real-world connection, never to make him feel he is failing. It supports the brief's rule against dependency on the app.",
    sources: [
      { citation: "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: A meta-analytic review. PLoS Medicine, 7(7), e1000316.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "masculinity-help-seeking",
    title: "Masculine norms and asking for help",
    keywords: ["man up", "real men", "asking for help", "therapy is for", "weakness to", "tough it out", "should handle it myself"],
    evidence: "established",
    guidance:
      "Research finds that rigid adherence to some masculine norms, such as self-reliance and emotional control, is associated with poorer mental health and less help-seeking, while other norms are less clearly linked. Many men find it easier to seek help framed as practical problem-solving or as doing right by the people who depend on them.",
    caveats: "Do not criticise masculinity as such; the brief calls for healthy masculine identity. Present norms as things he can choose to keep or adapt.",
    sources: [
      { citation: "Addis, M. E., & Mahalik, J. R. (2003). Men, masculinity, and the contexts of help seeking. American Psychologist, 58(1), 5–14.", verified: false },
      { citation: "Wong, Y. J., Ho, M.-H. R., Wang, S.-Y., & Miller, I. S. K. (2017). Meta-analyses of the relationship between conformity to masculine norms and mental health-related outcomes. Journal of Counseling Psychology, 64(1), 80–93.", verified: false },
    ],
    review: DRAFT,
  },
  {
    id: "father-wound-theory",
    title: "The 'father wound' idea: a lens, not a diagnosis",
    keywords: ["father wound", "daddy issues", "dad issues", "because of my dad", "my father's fault"],
    evidence: "theoretical",
    guidance:
      "Some writers in the Jungian and psychoanalytic traditions describe a 'father wound': the idea that a missing or distant father can leave a son searching for identity, approval or initiation into adulthood. Some men find this a meaningful way to reflect on their story. It is an interpretive framework, not a clinical diagnosis or an established research finding.",
    caveats:
      "Always say it is an idea some people find useful, never a diagnosis. Do not quote or summarise these books at length. Do not attribute all of his difficulties to his father.",
    sources: [
      { citation: "Corneau, G. (1991). Absent Fathers, Lost Sons: The Search for Masculine Identity. Shambhala.", verified: false },
      { citation: "Horrocks, R. (1994). Masculinity in Crisis: Myths, Fantasies and Realities. Macmillan.", verified: false },
    ],
    review: DRAFT,
  },
];

// Starting points named in the product brief whose details are not yet
// confirmed. They are not used anywhere until verified and turned into
// reviewed entries.
export const SOURCES_TO_VERIFY = [
  {
    name: "Absent Fathers, Lost Sons — Guy Corneau",
    status: "Publication details believed to be Shambhala, 1991 (English edition); verify against the book.",
  },
  {
    name: "Masculinity in Crisis — Roger Horrocks",
    status: "Publication details believed to be Macmillan, 1994; verify against the book.",
  },
  {
    name: "Sons of the Father",
    status: "Exact title, author and publisher unknown. The brief says these must be verified before use.",
  },
  {
    name: "The Fatherless Project",
    status: "Identity unknown (organisation or channel). Verify who runs it and whether it is a reliable source.",
  },
];
