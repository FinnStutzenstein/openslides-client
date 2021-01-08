import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { Permission } from 'app/core/core-services/permission';
import { TopicDetailComponent } from './components/topic-detail/topic-detail.component';

const routes: Route[] = [
    { path: 'new', component: TopicDetailComponent, data: { basePerm: Permission.agendaItemCanManage } },
    { path: ':id', component: TopicDetailComponent, data: { basePerm: Permission.agendaItemCanSee } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TopicsRoutingModule {}
