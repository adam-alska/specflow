<script lang="ts">
  import Header from '$lib/components/layout/Header.svelte'
  import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte'
</script>

<Header title="Board" showSearch={true} showNewButton={true} />
<KanbanBoard />
