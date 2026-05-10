export interface InterviewQuestion {
  id: string
  question: string
  whatWeNeed: string
  guidance: string
  feeds: string[]
  targetLength: string
}

export interface InterviewPart {
  attire: 'Business' | 'Clinical'
  title: string
  questions: InterviewQuestion[]
}

export interface ProductionNotes {
  location: string
  plannedDate: string
  part1Outfit: string
  part2Outfit: string
  equipmentNotes: string
  bRollNotes: string
  travelLogistics: string
  teamNotes: string
}

export const DEFAULT_PRODUCTION_NOTES: ProductionNotes = {
  location: '',
  plannedDate: '',
  part1Outfit: 'Business attire — suit or smart professional wear',
  part2Outfit: 'Clinical attire — white coat or scrubs',
  equipmentNotes: 'Lapel microphone. Clean audio — no clinical background noise during answers.\n\nQuestions displayed on screen: PP Telegraph font · #003845 background · white text · held 3 seconds before consultant begins.',
  bRollNotes: 'Between answers:\n· Consultant at their desk\n· Walking through the clinic\n· At diagnostic equipment (IOLMaster 700, slit lamp)\n· In theatre environment where applicable',
  travelLogistics: '',
  teamNotes: '',
}

export interface ConsultantInterview {
  id: number
  name: string
  specialty: string
  postsFed: string[]
  part1: InterviewPart
  part2: InterviewPart
}

export const VIDEOGRAPHY_STRATEGY = {
  title: 'Videography Strategy and Snippet Plan',
  status: 'Draft' as const,
  pillar: 'Leadership' as const,
  type: 'Production Asset',
  description: `CES Medical is producing four long-form interview videos as the primary content asset for the May to July 2026 campaign. The interviews feature Mr Nick Kopsachilis, Mr Kashif Qureshi, Mr Syed Shahid and Elion Hyseni.\n\nEach interview is structured in two parts. Part one is filmed in business attire and covers the consultant or founder perspective on CES Medical, the local community mission, the NHS and private pathway and what makes CES different. Part two is filmed in clinical attire and covers the consultant's specialist expertise, the conditions they treat, the procedures they perform and what patients can expect.\n\nThe clothing change between parts is intentional. It acts as a visual signal to the viewer that the conversation has shifted from the organisational to the clinical. No narration is needed to explain the transition.\n\nEach question is displayed on screen in PP Telegraph font on a deep teal background. There is no presenter or interviewer. The consultant reads the question and answers direct to camera, speaking to one person not a room.\n\nEvery answer is written to stand alone as a 30 to 90 second snippet. After filming, each answer is exported as an individual clip, subtitled and formatted for social use in square format for Instagram and Facebook and landscape format for LinkedIn and YouTube.\n\nThe full long-form interview is edited as a single video per consultant, hosted on YouTube and embedded on each consultant profile page at cesmedical.co.uk.\n\nThe snippets feed directly into the 48-post campaign. Each clip is tagged with the post ID it feeds so the content team can match assets to scheduled posts without ambiguity. The post mapping is documented in the Consultant Interview Scripts card.\n\nB-roll is captured between answers at each filming location: consultant at their desk, walking through the clinic, at diagnostic equipment including the Zeiss IOLMaster 700, and in the theatre environment where applicable.\n\nThis strategy means one filming day per consultant produces assets that serve the website, YouTube, Instagram, Facebook, LinkedIn and the full three-month campaign simultaneously.`,
  productionNotes: {
    onTheDay: [
      'Record each part separately with a clothing change in between',
      'Shoot each answer as a standalone take where possible so editing for snippets is clean',
      'B-roll to capture between answers: consultant at their desk, walking through the clinic, at equipment (IOLMaster, slit lamp), in the theatre environment',
      'Ensure clean audio — lapel microphone, quiet room, no clinical background noise during answers',
      'Questions on screen should appear in PP Telegraph font on teal (#003845) background, white text, held for three seconds before the consultant begins',
    ],
    forWebsite: [
      'Full interview edited as a single video (15–20 minutes) per consultant',
      'Hosted on YouTube, embedded on the consultant profile page at cesmedical.co.uk',
      'Thumbnail: consultant headshot, name, and specialist area in PP Telegraph',
    ],
    forSocial: [
      'Each answer exported as a standalone clip',
      'Subtitled in Clash Display font',
      'Square format (1200 × 1200) for Instagram and Facebook',
      'Landscape format (1200 × 628) for LinkedIn and YouTube',
      'Each clip tagged with the post ID it feeds for the content team',
    ],
  },
}

export const CONSULTANT_INTERVIEWS: ConsultantInterview[] = [
  {
    id: 1,
    name: 'Mr Nick Kopsachilis',
    specialty: 'Corneal and Cataract Specialist',
    postsFed: ['P05', 'P08', 'P09', 'P10', 'P11', 'P17', 'P18', 'P21', 'P22', 'P23', 'P25', 'P28', 'P31', 'P38', 'P41', 'P43', 'P44'],
    part1: {
      attire: 'Business',
      title: 'The CES Perspective',
      questions: [
        {
          id: 'NK-B1',
          question: 'Why did you choose to work with CES Medical?',
          whatWeNeed: 'His genuine reason. Not corporate language. Something that connects back to the CES mission of local specialist care. Should feel personal.',
          guidance: 'Talk about what drew him to a practice built around community care in Kent. The fact that patients here do not have to travel to London for the level of expertise he brings. Mention the NHS and private integration. Keep it grounded and honest.',
          feeds: ['P01', 'P04', 'P17', 'P32', 'P42'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'NK-B2',
          question: 'What does "Global Care for Local People" mean to you in practice?',
          whatWeNeed: 'His interpretation of the CES mission in real terms. What does internationally trained expertise actually look like for a patient in Tunbridge Wells or Chatham?',
          guidance: 'He trained in Munich, at Moorfields and at King\'s College London. He brings that level of training to patients in Kent who would otherwise need to travel to major centres. That is the tangible meaning of the tagline. Keep it specific not abstract.',
          feeds: ['P04', 'P17', 'P42'],
          targetLength: '30–45 seconds',
        },
        {
          id: 'NK-B3',
          question: 'What is the real difference between NHS and private eye care at CES?',
          whatWeNeed: 'A clear, honest answer. Same consultant, same standards, different timelines. Not positioning private as superior quality.',
          guidance: 'In the NHS he operates through the same high standards. Privately, patients are seen faster, have more time at consultation and have a wider choice of lens. The care itself is the same. The access is different. This is important to say honestly because it builds trust.',
          feeds: ['P06', 'P19', 'P26', 'P34'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'NK-B4',
          question: 'What do you think holds patients back from seeking help with their eyes?',
          whatWeNeed: 'A consultant who understands patient psychology. Fear, procrastination, not knowing if they are "bad enough." This is a powerful snippet for the patient-facing posts.',
          guidance: 'Patients often wait years. They normalise gradual vision loss. They are frightened of surgery near their eyes. They do not know whether their symptoms warrant a specialist. The honest answer is: if you are wondering, it is worth a conversation. The first consultation is low-commitment.',
          feeds: ['P11', 'P37', 'P44', 'P48'],
          targetLength: '45–60 seconds',
        },
      ],
    },
    part2: {
      attire: 'Clinical',
      title: 'The Specialist Perspective',
      questions: [
        {
          id: 'NK-C1',
          question: 'What does an oculoplastic surgeon do that a cosmetic surgeon cannot?',
          whatWeNeed: 'The clearest possible articulation of why an ophthalmologist with oculoplastic subspecialty training is the right person for eyelid surgery. This is the most commercially important answer in his interview.',
          guidance: 'The eyelid is not just skin. It sits directly over the eye. An oculoplastic surgeon understands the anatomy of the eye, the tear film, the risk to vision if something goes wrong. A cosmetic surgeon does not have that training. For both functional and cosmetic eyelid work, the eye needs to be protected throughout. That is why the subspecialty exists.',
          feeds: ['P10', 'P21', 'P28', 'P38', 'P44'],
          targetLength: '60–75 seconds',
        },
        {
          id: 'NK-C2',
          question: 'What is ptosis and how do you know if yours is affecting your vision?',
          whatWeNeed: 'A plain-English explanation of drooping upper eyelids as a medical condition, not a cosmetic concern. Key message: if it is affecting your vision or your visual field, it is a medical issue and may be covered by insurance.',
          guidance: 'Ptosis is the medical term for a drooping upper eyelid. When it drops far enough to cut into your field of vision, it becomes a medical problem, not just an aesthetic one. Patients often come thinking they want cosmetic surgery and we discover it is functional. That changes the pathway, the consent and sometimes the funding.',
          feeds: ['P10', 'P18', 'P34', 'P38'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'NK-C3',
          question: 'What happens at an eyelid surgery consultation at CES?',
          whatWeNeed: 'Demystify the first visit. Patients delay because they do not know what to expect. Make the first step feel small.',
          guidance: 'We look at the eyelids, measure the degree of ptosis or the amount of excess skin, assess how it is affecting vision, discuss whether functional or cosmetic indications apply, and talk through the options. No pressure to decide on the day. The consultation is about information. The decision comes afterwards, in the patient\'s own time.',
          feeds: ['P10', 'P11', 'P21', 'P44'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'NK-C4',
          question: 'What is the recovery from eyelid surgery actually like?',
          whatWeNeed: 'Honest, specific, day-by-day. This feeds P18 directly. No minimising and no frightening. Just the truth.',
          guidance: 'Day one, there will be bruising and swelling. That is normal and expected. Around day seven, stitches typically come out. By week two, most patients are back to everyday activities. The final result settles over six weeks. Some patients are surprised by how manageable it is. Others need longer. We tell patients both possibilities at the outset.',
          feeds: ['P18', 'P33', 'P38'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'NK-C5',
          question: 'What is the difference between a monofocal and a multifocal lens implant?',
          whatWeNeed: 'The clearest possible explanation of the lens choice. Honest about trade-offs. This is a cornerstone answer for the cataract posts.',
          guidance: 'A monofocal lens corrects vision at one distance, usually distance. Most people still need reading glasses. It is a well-established, reliable option. A multifocal lens tries to give vision at more than one distance. Many patients end up glasses-free or much less dependent on glasses. But not everyone adapts well. Some people notice haloes or reduced contrast at night, particularly in low light. The choice depends on how you use your eyes, your lifestyle, your driving habits and your expectations. We spend time on that conversation.',
          feeds: ['P05', 'P08', 'P09', 'P25', 'P31', 'P41', 'P43'],
          targetLength: '60–75 seconds',
        },
        {
          id: 'NK-C6',
          question: 'Who is and who is not a good candidate for multifocal lenses?',
          whatWeNeed: 'Honest clinical guidance. This builds trust more than any amount of promotional copy ever could.',
          guidance: 'Multifocal lenses work best for patients who are highly motivated to reduce glasses dependence, who have realistic expectations, and whose eyes meet certain criteria at the biometry measurements. Patients with certain corneal conditions, significant dry eye or very demanding night-time visual requirements may not adapt as well. We do not recommend a lens if we do not think it will serve the patient well. That conversation happens at consultation.',
          feeds: ['P08', 'P09', 'P25', 'P31', 'P41'],
          targetLength: '60 seconds',
        },
        {
          id: 'NK-C7',
          question: 'What does your PhD research into corneal cells mean for your patients?',
          whatWeNeed: 'A human explanation of how research-level knowledge affects real surgical decisions. Not academic. Patient-centred.',
          guidance: 'Understanding corneal endothelial cell biology at the level of his doctoral research directly informs how he plans surgery for patients with certain corneal conditions. When you know exactly how those cells behave under stress, you make different decisions. Better decisions. It is one of the reasons he offers complex corneal cases that other surgeons may not take on.',
          feeds: ['P17', 'P29'],
          targetLength: '30–45 seconds',
        },
        {
          id: 'NK-C8',
          question: 'What should a patient ask their surgeon before agreeing to cataract surgery?',
          whatWeNeed: 'Genuinely useful advice. Positions CES as confident and transparent. This is a powerful standalone snippet.',
          guidance: 'Ask how many procedures the surgeon performs each year. Ask what lens options are available and why one is being recommended over another. Ask what is included in the package and what is not. Ask what happens if something does not go to plan. A surgeon who is uncomfortable answering any of those questions is worth noting. We are not uncomfortable with any of them.',
          feeds: ['P30', 'P41'],
          targetLength: '45–60 seconds',
        },
      ],
    },
  },
  {
    id: 2,
    name: 'Mr Kashif Qureshi',
    specialty: 'Medical Retina and Cataract Specialist',
    postsFed: ['P03', 'P05', 'P08', 'P09', 'P15', 'P20', 'P25', 'P29', 'P30', 'P31', 'P33', 'P36', 'P39', 'P41', 'P43'],
    part1: {
      attire: 'Business',
      title: 'The CES Perspective',
      questions: [
        {
          id: 'KQ-B1',
          question: 'You have worked at some of the most respected eye hospitals in the UK. What brought you to CES Medical?',
          whatWeNeed: 'His genuine reason. Training at Guy\'s, St Thomas\'s, Manchester Royal Eye Hospital and Moorfields. What does he see in CES that he chose to bring that expertise here?',
          guidance: 'The opportunity to bring the level of care he trained in to patients who would otherwise not have easy access to it. In Kent, patients should not have to travel to London or Manchester for specialist retina care. CES makes that possible locally. It is a straightforward but powerful answer.',
          feeds: ['P04', 'P17', 'P42'],
          targetLength: '45 seconds',
        },
        {
          id: 'KQ-B2',
          question: 'You spent four years as UK Lead for Revalidation for all ophthalmologists. What does that mean for patients choosing a surgeon?',
          whatWeNeed: 'A plain-English explanation of what revalidation is and why it matters. Without sounding like a CV recitation.',
          guidance: 'Revalidation is the process every consultant in the UK goes through to demonstrate they are still fit to practise. As UK lead, he oversaw the standards all ophthalmologists are held to. Patients booking a consultant should know that every FRCOphth practitioner has been through that process. It is not a formality. It is what separates regulated specialist practice from unregulated cosmetic procedures elsewhere.',
          feeds: ['P17', 'P28'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'KQ-B3',
          question: 'What is the most common thing patients get wrong about cataract surgery?',
          whatWeNeed: 'Something specific and interesting. Not a generic answer. Something that reflects 25 years of patient conversations.',
          guidance: 'Most patients assume it is a major operation requiring general anaesthetic and a long recovery. It is typically done under local anaesthetic, takes around 15 to 20 minutes, and most people are back to gentle daily activities the following day. The fear is almost always bigger than the reality. But the fear is understandable because it is surgery on your eye, and patients need to be given the time to process that honestly.',
          feeds: ['P03', 'P33', 'P37'],
          targetLength: '45–60 seconds',
        },
      ],
    },
    part2: {
      attire: 'Clinical',
      title: 'The Specialist Perspective',
      questions: [
        {
          id: 'KQ-C1',
          question: 'In simple terms, what is a cataract and when does it need treating?',
          whatWeNeed: 'The clearest possible 60-second explanation. This feeds P03 directly. Should feel like talking to one patient, not a lecture hall.',
          guidance: 'The natural lens inside your eye is normally clear. Over time, it clouds over. That is a cataract. It happens gradually, which is why many people do not notice until their optician tells them or until they realise they are struggling with driving at night or reading in dim light. When it starts to affect what you can do day to day, it is worth considering surgery. There is no set threshold. It is a conversation about quality of life.',
          feeds: ['P03', 'P22', 'P37'],
          targetLength: '60 seconds',
        },
        {
          id: 'KQ-C2',
          question: 'What technology do you use to plan cataract surgery and why does it matter?',
          whatWeNeed: 'A specific, patient-relevant explanation of the Zeiss IOLMaster 700. Not a brochure answer. Why does the measurement stage matter for the outcome?',
          guidance: 'Before surgery, we measure the eye very precisely to calculate the right lens power. We use the Zeiss IOLMaster 700, which is one of the most accurate biometry devices available. The reason that matters is simple: if the measurement is slightly wrong, the lens power will be slightly wrong, and the patient\'s vision after surgery will be less predictable. Precision at the planning stage directly affects the outcome.',
          feeds: ['P29', 'P30'],
          targetLength: '45 seconds',
        },
        {
          id: 'KQ-C3',
          question: 'What is YAG laser vitreolysis and why is it something very few surgeons offer?',
          whatWeNeed: 'A clear, accessible explanation of a procedure that positions Mr Qureshi as offering something exceptional. One of only a handful of surgeons in the UK offering this.',
          guidance: 'Vitreous floaters are shadows that appear in your vision, usually as dots, threads or cobwebs. Most people are told to live with them. For patients whose floaters are significantly affecting their quality of life, there is a laser procedure called YAG vitreolysis that can break them up. Very few surgeons in the UK offer it because it requires specialist training and specific equipment. We offer it because patients deserve the option, not just the advice to ignore them.',
          feeds: ['P39'],
          targetLength: '60 seconds',
        },
        {
          id: 'KQ-C4',
          question: 'What is the 2RT nanopulse laser for dry AMD and what does it offer patients who currently have no treatment options?',
          whatWeNeed: 'This is genuinely significant. Dry AMD currently has very limited treatment options on the NHS. Mr Qureshi is one of very few specialists in the UK offering this. It needs to be explained clearly without overclaiming.',
          guidance: 'Age-related macular degeneration affects the central vision. The wet form has treatments. The dry form, until recently, has had very little. The 2RT laser uses very short, precise pulses of energy to stimulate the cells at the back of the eye. Clinical evidence suggests it can slow progression in some patients. It is not a cure and it does not work for everyone, but for patients with dry AMD who have been told there is nothing to be done, it is worth knowing this option exists and discussing whether they might be suitable.',
          feeds: [],
          targetLength: '75 seconds',
        },
        {
          id: 'KQ-C5',
          question: 'How do you choose the right lens for a patient and what does that conversation look like?',
          whatWeNeed: 'The human, consultative side of lens selection. Feeds the lens choice posts directly.',
          guidance: 'It starts with understanding how the patient uses their eyes. Do they drive at night? Do they do a lot of close-up reading? Are they comfortable with the idea of still wearing glasses for some tasks? Are their eyes otherwise healthy enough for a multifocal lens to work well? We look at all of that together. There is no single right answer. The right lens is the one that fits the patient\'s life, not the one that looks best on paper.',
          feeds: ['P05', 'P08', 'P09', 'P25', 'P31', 'P41', 'P43'],
          targetLength: '60 seconds',
        },
        {
          id: 'KQ-C6',
          question: 'What should patients with diabetes know about protecting their eyesight?',
          whatWeNeed: 'Urgent but not alarming. Clinical Lead context from Mr Shahid\'s territory, but Mr Qureshi covers retinal disease including diabetic retinopathy.',
          guidance: 'Diabetes can damage the small blood vessels in the retina, sometimes years before any symptoms appear. Annual diabetic eye screening exists for exactly this reason. If damage is caught early, there is far more we can do. If it is caught late, the options narrow significantly. The message is simple: if you have diabetes, do not skip your annual eye check.',
          feeds: ['P36', 'P46'],
          targetLength: '45 seconds',
        },
        {
          id: 'KQ-C7',
          question: 'What is a YAG capsulotomy and why do some patients need one after successful cataract surgery?',
          whatWeNeed: 'Reassurance for patients who think their cataract has returned. Quick, clear, specific.',
          guidance: 'After cataract surgery, the lens sits inside a thin membrane called the capsule. In some patients, that capsule slowly clouds over in the months or years after surgery. Vision becomes blurry again and patients often think the cataract has come back. It has not. A short YAG laser procedure clears the capsule, usually in under ten minutes, with no incision. It is one of the most satisfying procedures we do because the improvement in vision is immediate.',
          feeds: ['P39'],
          targetLength: '45–60 seconds',
        },
      ],
    },
  },
  {
    id: 3,
    name: 'Mr Syed Shahid',
    specialty: 'Cataract and Vitreoretinal Surgeon',
    postsFed: ['P03', 'P05', 'P13', 'P22', 'P27', 'P30', 'P33', 'P36', 'P39', 'P41', 'P46'],
    part1: {
      attire: 'Business',
      title: 'The CES Perspective',
      questions: [
        {
          id: 'SS-B1',
          question: 'You trained at Moorfields Eye Hospital. What does that experience mean for patients in Kent?',
          whatWeNeed: 'Moorfields is the world\'s leading specialist eye hospital. That credential needs to be connected to a real patient benefit, not used as a badge.',
          guidance: 'Moorfields sees some of the most complex eye conditions in the world. The training there is genuinely intensive. What it gives a surgeon is exposure to cases that most practitioners rarely encounter. When a patient in Kent comes to us with something complicated, they benefit from that training without needing to travel to London themselves. That is the practical value.',
          feeds: ['P04', 'P17', 'P27', 'P42'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'SS-B2',
          question: 'You are one of the very few vitreoretinal surgeons serving patients in Kent. Why does that matter?',
          whatWeNeed: 'This is his key differentiator and it needs to be stated clearly and without arrogance. The scarcity is a genuine patient benefit.',
          guidance: 'Vitreoretinal surgery covers conditions at the back of the eye — retinal detachment, macular hole, epiretinal membrane. These are serious conditions that can threaten sight. In many parts of the country, patients needing this surgery face long waits or significant travel. Having a Moorfields-trained vitreoretinal surgeon available in Kent means patients get faster access to the right treatment when it matters most.',
          feeds: ['P27', 'P36', 'P46'],
          targetLength: '60 seconds',
        },
        {
          id: 'SS-B3',
          question: 'As Clinical Lead for the Kent and Medway Diabetic Eye Screening Programme, what do you see that most patients do not?',
          whatWeNeed: 'His unique perspective as the person overseeing diabetic eye care across the entire Kent and Medway region. This is a powerful authority position.',
          guidance: 'He oversees the screening of thousands of diabetic patients across Kent and Medway. What he sees consistently is that patients who attend their annual screening regularly give themselves options when problems are found. Patients who skip screening often present when damage is already advanced. The screening itself takes minutes. The difference it makes to outcomes can be enormous.',
          feeds: ['P36', 'P46'],
          targetLength: '45–60 seconds',
        },
      ],
    },
    part2: {
      attire: 'Clinical',
      title: 'The Specialist Perspective',
      questions: [
        {
          id: 'SS-C1',
          question: 'What is vitreoretinal surgery and what conditions does it treat?',
          whatWeNeed: 'A plain-English introduction to a subspecialty most patients have never heard of. Designed for patients who have just received a diagnosis or referral.',
          guidance: 'The vitreous is the gel-like substance that fills the eye. The retina is the light-sensitive layer at the back. Vitreoretinal surgery covers conditions affecting both. Retinal detachment is a medical emergency where the retina peels away from the back of the eye. Macular hole is a small break in the centre of the retina affecting detailed vision. Epiretinal membrane is scar tissue that forms over the macula and distorts vision. These conditions sound frightening, but with the right surgical care at the right time, outcomes are often very good.',
          feeds: ['P27', 'P46'],
          targetLength: '60–75 seconds',
        },
        {
          id: 'SS-C2',
          question: 'What are the signs of a retinal detachment and what should someone do if they suspect one?',
          whatWeNeed: 'Clear, urgent, potentially sight-saving information. Should prompt people to act quickly without causing panic.',
          guidance: 'The warning signs are a sudden increase in floaters, flashes of light, or a shadow or curtain moving across your vision. Any of these, particularly if they appear suddenly, need urgent assessment. Retinal detachment is a medical emergency. Do not wait for a routine appointment. Contact an eye casualty department or call us directly. Time matters significantly with retinal detachment because the longer it is left, the greater the risk to central vision.',
          feeds: ['P27', 'P36'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'SS-C3',
          question: 'What is the recovery from cataract surgery actually like — day by day?',
          whatWeNeed: 'Specific, honest, reassuring. This is one of the most searched questions by patients considering cataract surgery.',
          guidance: 'Most patients go home the same day. The eye will feel a little scratchy or gritty for the first day or two. Vision may be blurry initially and then gradually improve over the first week. Eye drops are used for several weeks after surgery. Driving is usually possible within a few days once vision meets the legal standard. Heavy lifting and swimming are restricted for a few weeks. Most people are pleasantly surprised by how manageable the recovery is.',
          feeds: ['P33', 'P41'],
          targetLength: '60 seconds',
        },
        {
          id: 'SS-C4',
          question: 'Why do some patients need cataract surgery in both eyes and what is the process for the second eye?',
          whatWeNeed: 'Clear explanation of bilateral cataract surgery. Why both eyes matter even when one feels fine.',
          guidance: 'Cataracts typically develop in both eyes, though often at different rates. Treating one eye and not the other can leave a significant imbalance. Your brain relies on both eyes working together for depth perception, balance and overall visual quality. After the first eye surgery, we review the result and plan the second eye accordingly. The interval is usually a few weeks. Many patients notice an immediate difference in their overall visual quality once both eyes are done.',
          feeds: ['P22', 'P33'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'SS-C5',
          question: 'What do you look for when deciding which lens is right for a patient?',
          whatWeNeed: 'His personal approach to lens selection. Should feel consultative and individual.',
          guidance: 'Lifestyle is the starting point. What does this person need their eyes to do? How important is driving at night? How much reading do they do? Are they happy potentially wearing glasses for some tasks or are they motivated to reduce glasses dependence as much as possible? Then we look at the eye itself. Certain corneal conditions or significant dry eye can affect how well a multifocal lens performs. The clinical picture and the patient\'s expectations have to align before we recommend a lens.',
          feeds: ['P05', 'P08', 'P09', 'P41'],
          targetLength: '60 seconds',
        },
        {
          id: 'SS-C6',
          question: 'What is the most important thing you would tell someone who has just been told they have diabetic retinopathy?',
          whatWeNeed: 'Reassuring, authoritative, action-oriented. Avoid alarm. The message is: early-stage retinopathy is manageable.',
          guidance: 'The first thing is: do not panic. Diabetic retinopathy covers a wide spectrum. Early-stage changes may need monitoring but not immediate treatment. More advanced changes may need laser or injections. The important thing is to keep attending your annual screening, to manage blood sugar as well as possible, and to see a specialist if changes are progressing. Most patients with diabetic retinopathy, when it is caught and managed appropriately, do not lose their sight.',
          feeds: ['P36', 'P46'],
          targetLength: '60 seconds',
        },
      ],
    },
  },
  {
    id: 4,
    name: 'Elion Hyseni',
    specialty: 'Founder and CEO',
    postsFed: ['P01', 'P04', 'P06', 'P17', 'P32', 'P42', 'P45', 'P47', 'P48'],
    part1: {
      attire: 'Business',
      title: 'The Founder Perspective',
      questions: [
        {
          id: 'EH-B1',
          question: 'Why did you found CES Medical?',
          whatWeNeed: 'The genuine founding story. Personal, principled, specific. Not a corporate mission statement.',
          guidance: 'The answer should be grounded in a real observation or frustration. Patients in Kent waiting too long. Specialist care concentrated in London. The belief that the quality of your eye care should not depend on your postcode or your ability to travel. Keep it human and specific. This is the most important answer in his entire interview.',
          feeds: ['P01', 'P32', 'P42', 'P47'],
          targetLength: '60–75 seconds',
        },
        {
          id: 'EH-B2',
          question: 'What does "Global Care for Local People" mean to you?',
          whatWeNeed: 'His personal interpretation. Internationally trained consultants. Kent communities. The two ideas brought together.',
          guidance: 'We have consultants who trained at Moorfields, at Munich, at Guy\'s and St Thomas\'s. That level of training does not always reach community level. We built CES to change that. The patient in Headcorn or Chatham or Tunbridge Wells deserves the same standard of care as the patient who can get themselves to Great Portland Street. That is what the tagline means in practice.',
          feeds: ['P01', 'P42'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'EH-B3',
          question: 'CES serves both NHS and private patients. Why is that important to you?',
          whatWeNeed: 'The principle behind the dual pathway. This is a values statement, not a commercial one.',
          guidance: 'Eye disease does not discriminate by income. Cataracts, glaucoma, retinal conditions affect people across every demographic. We believe in serving both pathways because the need exists in both. Our NHS patients receive the same standard of care from the same consultants. The difference is access speed and lens choice for private patients, not the quality of the surgeon or the surgery.',
          feeds: ['P06', 'P19', 'P26'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'EH-B4',
          question: 'What has surprised you most about building CES Medical?',
          whatWeNeed: 'Something honest and unexpected. A moment of genuine reflection. This humanises him as a founder.',
          guidance: 'He should answer this genuinely. Whatever has surprised him most, whether it is patient demand, the emotional weight of sight-related conditions, the complexity of building a multi-site clinical service, or something else. The more specific and honest, the more powerful the snippet.',
          feeds: ['P32', 'P45', 'P47'],
          targetLength: '45–60 seconds',
        },
        {
          id: 'EH-B5',
          question: 'Where is CES Medical going next?',
          whatWeNeed: 'A forward-looking founder statement. Not a press release. Specific enough to be interesting, measured enough to be credible.',
          guidance: 'More locations. More services. Deeper NHS integration. The goal is to make specialist eye care genuinely accessible across Kent, not just where it currently exists. Should feel like a founder who is building something, not managing something.',
          feeds: ['P47', 'P48'],
          targetLength: '45 seconds',
        },
      ],
    },
    part2: {
      attire: 'Clinical',
      title: 'The Optometrist Perspective',
      questions: [
        {
          id: 'EH-C1',
          question: 'As a Consultant Clinical Optometrist, what do you see that patients often miss about their own eye health?',
          whatWeNeed: 'His clinical perspective. The things patients normalise or ignore that they should not.',
          guidance: 'Gradual change is the biggest risk. Patients adapt to worsening vision so slowly that they do not notice how much they have lost until a test reveals it. Cataracts are the obvious example. But glaucoma is even more dangerous because there are no symptoms until damage is significant. Regular eye exams are not optional maintenance. They are the mechanism by which sight loss is prevented.',
          feeds: ['P02', 'P20', 'P36', 'P46'],
          targetLength: '60 seconds',
        },
        {
          id: 'EH-C2',
          question: 'What should every person over 50 in Kent know about their eye health?',
          whatWeNeed: 'A direct, practical, patient-facing statement from the founder and clinical optometrist. Strong closing snippet.',
          guidance: 'Have a full eye examination at least every two years, more frequently if you have diabetes, glaucoma in the family or any existing eye condition. Do not wait until something is wrong. The conditions most likely to threaten your sight in later life — cataracts, glaucoma, AMD — are all manageable when caught early. The conversation that changes your outcome often starts with a test you almost skipped.',
          feeds: ['P20', 'P36', 'P41', 'P48'],
          targetLength: '45–60 seconds',
        },
      ],
    },
  },
]

export const POST_MAPPING: Record<string, string[]> = {
  P03: ['Qureshi C1', 'Shahid C1'],
  P05: ['Kopsachilis C5', 'Qureshi C5', 'Shahid C5'],
  P08: ['Kopsachilis C5', 'C6'],
  P09: ['Kopsachilis C5', 'C6'],
  P10: ['Kopsachilis C1', 'C2', 'C3'],
  P11: ['Kopsachilis C3', 'B4'],
  P17: ['Qureshi B2', 'Kopsachilis C7'],
  P18: ['Kopsachilis C4'],
  P21: ['Kopsachilis C1', 'C3'],
  P22: ['Shahid C4'],
  P25: ['Kopsachilis C5', 'Qureshi C5'],
  P27: ['Shahid C1', 'C2'],
  P28: ['Kopsachilis C1'],
  P29: ['Qureshi C2'],
  P30: ['Kopsachilis C8', 'Qureshi C2'],
  P31: ['Kopsachilis C5', 'C6'],
  P32: ['Elion B1', 'B4'],
  P33: ['Shahid C3', 'Qureshi B3'],
  P36: ['Qureshi C6', 'Shahid B3', 'C6'],
  P38: ['Kopsachilis C1', 'C4'],
  P39: ['Qureshi C7'],
  P41: ['Kopsachilis C8', 'Shahid C3'],
  P42: ['Elion B2', 'B3'],
  P43: ['Kopsachilis C5', 'Qureshi C5'],
  P44: ['Kopsachilis C1', 'B4'],
  P46: ['Shahid B2', 'C6'],
  P47: ['Elion B5', 'B4'],
  P48: ['Elion C2'],
}
