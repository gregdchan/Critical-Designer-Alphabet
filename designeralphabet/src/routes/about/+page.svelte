<script lang="ts">
  import { IconLightbulb as Lightbulb, IconUsers as Users, IconClock as Clock, IconTarget as Target, IconPencil as Pencil, IconRefresh as Refresh } from '@tabler/icons-svelte';
</script>

<svelte:head>
  <title>About - Critical Designer Alphabet</title>
  <meta name="description" content="Learn about The Designer's Critical Alphabet and the Critical Design Brainstorming Process." />
</svelte:head>

<div class="space-y-12">
  <!-- Welcome Section -->
  <section class="bg-slate-800 rounded-lg border border-slate-600 p-8">
    <div class="flex items-start gap-4 mb-6">
      <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
        <Lightbulb class="h-6 w-6" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-slate-100 mb-2">Welcome</h1>
      </div>
    </div>

    <div class="text-slate-300 space-y-4">
      <p>
        The Designer's Critical Alphabet is a tool created by Dr. Leslie Ann Noel, an advocate for inclusive and critical design practices. The alphabet consists of a set of cards, each representing a concept or term that encourages designers to think more critically and inclusively about their work.
      </p>
      <p>
        The tool is meant to challenge traditional design thinking by prompting designers to consider aspects such as power dynamics, cultural relevance, and social justice in their creative processes.
      </p>
    </div>
  </section>

  <!-- Critical Design Brainstorming Process -->
  <section class="bg-slate-800 rounded-lg border border-slate-600 p-8">
    <div class="flex items-start gap-4 mb-8">
      <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
        <Users class="h-6 w-6" />
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-slate-100 mb-2">Critical Design Brainstorming Process</h2>
        <p class="text-slate-400">A structured approach to inclusive and socially responsible design</p>
      </div>
    </div>

    <!-- Objective -->
    <div class="bg-slate-700 rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
        <Target class="h-5 w-5 text-green-400" />
        Objective
      </h3>
      <p class="text-slate-300">
        To generate design ideas that are not only innovative but also critically aware, socially responsible, and inclusive by incorporating concepts from the Designer's Critical Alphabet.
      </p>
    </div>

    <!-- Materials -->
    <div class="bg-slate-700 rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
        <Pencil class="h-5 w-5 text-blue-400" />
        Materials
      </h3>
      <ul class="text-slate-300 space-y-2">
        <li>• Designer's Critical Alphabet deck (physical cards or a digital version)</li>
        <li>• Whiteboard, sticky notes, or digital brainstorming tools</li>
        <li>• Pens, markers, or digital drawing tools</li>
        <li>• Timer</li>
      </ul>
    </div>

    <!-- Steps -->
    <div class="space-y-6">
      <h3 class="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
        <Refresh class="h-5 w-5 text-purple-400" />
        Steps
      </h3>

      <!-- Step 1 -->
      <div class="border-l-4 border-blue-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-blue-400 mb-3">1. Define the Design Challenge</h4>
        <div class="space-y-3 text-slate-300">
          <p>Begin by clearly defining the design challenge or problem you want to address. This could be anything from developing a new product, service, or campaign, to redesigning a process or system.</p>
          <p>Ensure the challenge is specific enough to focus your brainstorming, but open-ended enough to allow for creativity.</p>
          <div class="bg-slate-600/50 rounded-lg p-4 italic">
            <p><strong>Example:</strong> "Design a community space that promotes inclusivity and well-being."</p>
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="border-l-4 border-purple-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-purple-400 mb-3">2. Select Critical Concepts</h4>
        <div class="space-y-3 text-slate-300">
          <p>Draw 3-5 cards from the Designer's Critical Alphabet deck. These cards will represent the critical concepts that must be integrated into the brainstorming process.</p>
          <p>Read and discuss each concept to ensure everyone understands its relevance.</p>
          <div class="bg-slate-600/50 rounded-lg p-4 italic">
            <p><strong>Example:</strong> Draw cards for "C" (Colonialism), "R" (Representation), and "E" (Empathy).</p>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="border-l-4 border-green-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-green-400 mb-3">3. Initial Ideation (10-15 minutes)</h4>
        <div class="space-y-3 text-slate-300">
          <p>Start with an open brainstorming session. Encourage everyone to generate as many ideas as possible, without judgment or filtering. Focus on quantity over quality.</p>
          <p>As you brainstorm, keep the critical concepts in mind, but don't worry about fully integrating them yet. This step is about getting a broad range of ideas on the table.</p>
          <div class="bg-slate-600/50 rounded-lg p-4">
            <p><strong>Tip:</strong> Use sticky notes or a digital tool to capture every idea so they can be easily moved and grouped later.</p>
          </div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="border-l-4 border-orange-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-orange-400 mb-3">4. Concept Integration (15-20 minutes)</h4>
        <div class="space-y-3 text-slate-300">
          <p>Review the ideas generated during the initial ideation. As a group, discuss how each idea can be refined or expanded to incorporate the critical concepts drawn from the alphabet.</p>
          <p>For each idea, ask:</p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li>How does this idea address or challenge colonialism?</li>
            <li>Does this idea ensure diverse representation?</li>
            <li>How can empathy be central to this design?</li>
          </ul>
          <p>Modify, combine, or discard ideas based on how well they align with the critical concepts.</p>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="border-l-4 border-pink-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-pink-400 mb-3">5. Refinement and Prototyping (20-30 minutes)</h4>
        <div class="space-y-3 text-slate-300">
          <p>Choose 2-3 ideas that best integrate the critical concepts and have potential to meet the design challenge.</p>
          <p>Spend time refining these ideas, considering feasibility, user experience, and impact. Create rough sketches, wireframes, or storyboards to visualize the concepts.</p>
          <p>Ensure that the critical concepts remain central to the design. Revisit the cards if necessary to check alignment.</p>
        </div>
      </div>

      <!-- Step 6 -->
      <div class="border-l-4 border-cyan-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-cyan-400 mb-3">6. Feedback and Iteration (15-20 minutes)</h4>
        <div class="space-y-3 text-slate-300">
          <p>Share the refined ideas with the group or a broader audience for feedback. Focus on how well the designs incorporate the critical concepts.</p>
          <p>Gather insights on what works well and what could be improved, particularly in terms of inclusivity and social impact.</p>
          <p>Iterate on the designs based on the feedback, making adjustments to better align with the critical concepts.</p>
        </div>
      </div>

      <!-- Step 7 -->
      <div class="border-l-4 border-yellow-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-yellow-400 mb-3">7. Final Presentation</h4>
        <div class="space-y-3 text-slate-300">
          <p>Prepare a final presentation of the refined design concepts, highlighting how the critical concepts from the Designer's Critical Alphabet have been integrated.</p>
          <p>Discuss the potential impact of the design and any challenges that were encountered during the process.</p>
        </div>
      </div>

      <!-- Step 8 -->
      <div class="border-l-4 border-teal-500 pl-6 py-4">
        <h4 class="text-lg font-semibold text-teal-400 mb-3">8. Reflection and Discussion</h4>
        <div class="space-y-3 text-slate-300">
          <p>Conclude the session with a group reflection on the process. Discuss how the critical concepts influenced the brainstorming and design decisions.</p>
          <p>Consider how these concepts might continue to influence future design work and what was learned about critical design thinking.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Optional Documentation -->
  <section class="bg-slate-800 rounded-lg border border-slate-600 p-8">
    <h3 class="text-xl font-semibold text-slate-100 mb-4">Optional: Documentation</h3>
    <p class="text-slate-300">
      Document the entire brainstorming process, including the initial ideas, the integration of critical concepts, and the final designs. This documentation can serve as a valuable resource for future projects and as a record of how critical design practices were applied.
    </p>
  </section>

  <!-- Tips for Success -->
  <section class="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-slate-600 rounded-lg p-8">
    <h3 class="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
      <Lightbulb class="h-5 w-5 text-yellow-400" />
      Tips for Success
    </h3>
    <div class="space-y-4 text-slate-300">
      <div class="flex gap-4">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 flex-shrink-0 mt-1">
          <Users class="h-4 w-4" />
        </div>
        <div>
          <h4 class="font-semibold text-slate-200 mb-2">Diverse Perspectives</h4>
          <p>Ensure that the brainstorming team includes diverse perspectives to enrich the discussion and the design outcomes.</p>
        </div>
      </div>
      <div class="flex gap-4">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 flex-shrink-0 mt-1">
          <Target class="h-4 w-4" />
        </div>
        <div>
          <h4 class="font-semibold text-slate-200 mb-2">Facilitation</h4>
          <p>A facilitator can help keep the session focused and ensure that the critical concepts are consistently considered throughout the process.</p>
        </div>
      </div>
      <div class="flex gap-4">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600/20 text-green-400 flex-shrink-0 mt-1">
          <Refresh class="h-4 w-4" />
        </div>
        <div>
          <h4 class="font-semibold text-slate-200 mb-2">Flexibility</h4>
          <p>Be open to where the critical concepts lead the brainstorming. They may take the design in unexpected and innovative directions.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Conclusion -->
  <section class="bg-slate-700 rounded-lg p-6 text-center">
    <p class="text-slate-300 italic">
      This brainstorming process leverages the Designer's Critical Alphabet to ensure that design solutions are not only creative but also deeply thoughtful and aligned with principles of equity, inclusion, and social justice.
    </p>
  </section>
</div>