import { createSignal, For } from "solid-js";
import { GENRE_REGISTRY } from "../../config/midi/genres";
import type { GenreKey } from "../../types/midi/Song";

const Test = () => {

const genres = Object.keys(GENRE_REGISTRY) as GenreKey[];

const [prompt, setPrompt] = createSignal("Downtempo pop, warm electric piano, strummed guitar, flute answering the vocal line");
const [selectedGenre, setSelectedGenre] = createSignal<GenreKey>("lofi");

return(
<>

<header
class="sticky top-0 left-0 w-full p-4 lg:px-16 flex items-center justify-between gap-6 z-index-1000 backdrop-blue-md box-border bg-inherit"
>

<div class="grow flex items-center gap-4 items-center justify-center">
<span class="material-symbols-rounded">
auto_awesome
</span>
<span class="font-[Sarina]">
S/F
</span>
</div>
</header>

<main
class="relative w-full p-4 lg:px-16 flex flex-col items-center gap-8 box-border"
>

<section
class="relative w-full lg:w-3xl py-8 px-4 flex flex-col gap-4 
bg-surface-container rounded-[1rem] box-border"
>

<md-outlined-text-field
value={prompt()}
onChange={(t) => {
setPrompt(t.currentTarget.value);
}}
type="textarea"
label="Prompt Description"
placeholder="Downtempo pop, warm electric piano, strummed guitar, flute answering the vocal line..."
rows={3}
>
<span
slot="leading-icon"
class="material-symbols-rounded"
>
rule_settings
</span>
</md-outlined-text-field>

<md-outlined-select>
<span
slot="leading-icon"
class="material-symbols-rounded"
>
genres
</span>
<For each={genres}>
{(g) => {

const genre = GENRE_REGISTRY[g];
const selected = () => selectedGenre() === g;
return(
<md-select-option 
value={g}
selected={selected()}
>
<div 
slot="headline"
>{genre.name}</div>
</md-select-option>
)
}}
</For>

</md-outlined-select>

<button
class="mt-4 relative w-full p-4 flex items-center justify-center
 gap-2 bg-on-background text-background rounded-[2rem] box-border"
>
<span 
class="material-symbols-rounded"
>
auto_awesome
</span>
<span>
Generate
</span>
<md-ripple></md-ripple>
</button>

</section>

<section
class="relative w-full lg:w-3xl py-8 px-4 flex flex-col gap-4 
bg-surface-container rounded-[1rem] box-border"
>
{/* results */}
</section>
</main>

</>
);

}

export default Test;