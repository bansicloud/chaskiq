import React, {Component, createContext, Fragment} from 'react'
import axios from "axios"
import actioncable from "actioncable"
import {
  Route,
  Link
} from 'react-router-dom'
import TimeAgo from 'react-timeago'
import PropTypes from 'prop-types';

import Button, { ButtonGroup } from '@atlaskit/button';
import ContentWrapper from '../components/ContentWrapper';
import PageTitle from '../components/PageTitle';

import RadioGroup, { AkFieldRadioGroup, AkRadio } from '@atlaskit/field-radio-group';

import Avatar from '@atlaskit/avatar';
import DropdownMenu, {
  DropdownItemGroup,
  DropdownItem,
} from '@atlaskit/dropdown-menu';
import DynamicTable from '@atlaskit/dynamic-table'
import Form, { FormHeader,
              FormSection,
              FormFooter,
              Field, 
              FieldGroup, 
              Validator 
            } from '@atlaskit/form';
import styled from 'styled-components';
import InlineDialog from '@atlaskit/inline-dialog';
import Spinner from '@atlaskit/spinner';

import FieldRadioGroup from '@atlaskit/field-radio-group';
import KJUR from "jsrsasign"
import Modal from '@atlaskit/modal-dialog';

const CableApp = {
  cable: actioncable.createConsumer()
}
// Initialize a context
const Context = createContext()

// This context contains two interesting components
const { Provider, Consumer } = Context

function createKey(input) {
  return input ? input.replace(/^(the|a|an)/, '').replace(/\s/g, '') : input;
}

function getRandomString() {
  return `${lorem[Math.floor(Math.random() * lorem.length)]}`;
}

const caption = 'List of Users';

const Wrapper = styled.div`
  min-width: 600px;
`;

const createHead = (withWidth: boolean) => {
  return {
    cells: [
      {
        key: 'name',
        content: 'Name',
        isSortable: true,
        width: withWidth ? 25 : undefined,
      },
      {
        key: 'state',
        content: 'state',
        shouldTruncate: true,
        isSortable: true,
        width: withWidth ? 15 : undefined,
      },
      
      {
        key: 'last_visited_at',
        content: 'Las visited at',
        shouldTruncate: true,
        isSortable: true,
        width: withWidth ? 10 : undefined,
      },

      {
        key: 'term',
        content: 'Term',
        shouldTruncate: true,
        isSortable: true,
        width: withWidth ? 10 : undefined,
      },
    ],
  };
};

const NameWrapper = styled.span`
  display: flex;
  align-items: center;
`;

const AvatarWrapper = styled.div`
  margin-right: 8px;
`;

class AppUsers extends Component {
  constructor(props){
    super(props)
  }

  getTablaData(){

    const head = createHead(true);

    const app_users = this.props.app_users.map((app_user, index) => {
      return {
        key: `row-${index}-${app_user.email}`,
        cells: [
          {
            //key: createKey(app_user.email),
            content: (
              <NameWrapper>
                <AvatarWrapper>
                  <Avatar
                    name={app_user.email}
                    size="medium"
                    src={`https://api.adorable.io/avatars/24/${encodeURIComponent(
                      app_user.email,
                    )}.png`}
                  />
                </AvatarWrapper>
                <a href="https://atlassian.design">{app_user.email}</a>
              </NameWrapper>
            ),
          },
          {
            //key: createKey(app_user.state),
            content: app_user.state,
          },
          {
            //key: createKey(app_user.state),
            content: (<TimeAgo date={app_user.last_visited_at }/>),
          },
          {
            content: (
              <DropdownMenu trigger="More" triggerType="button">
                <DropdownItemGroup>
                  <DropdownItem>{app_user.email}</DropdownItem>
                </DropdownItemGroup>
              </DropdownMenu>
            ),
          },
        ],
      }
    }
    );

    return {head: head, rows: app_users}
  }

  caption = ()=>{
    return <div>
            <span>aaaa</span>

            <ButtonGroup>
              
              <Button onClick={this.context.addFlag}>
                Match all filters
              </Button>

            
              <Button isLoading={false} appearance={'link'}>
                <i className="fas fa-plus"></i>
                {" "}
                Add filter
              </Button>

              <Button isLoading={false} appearance={'link'}>
                <i className="fas fa-chart-pie"></i>
                {" "}
                Save Segment
              </Button>

            </ButtonGroup>

           </div>
  }


  render(){
    const {head, rows} = this.getTablaData()
    
    return <Wrapper>
                  <DynamicTable
                  caption={this.caption()}
                  head={head}
                  rows={rows}
                  rowsPerPage={10}
                  defaultPage={1}
                  loadingSpinnerSize="large"
                  isLoading={this.props.app_users.length == 0}
                  isFixedSize
                  defaultSortKey="term"
                  defaultSortOrder="ASC"
                  onSort={() => console.log('onSort')}
                  onSetPage={() => console.log('onSetPage')}
                  />
                </Wrapper>
  }
}

class Topic extends Component {

  constructor(props){
    super(props)
  }

  componentDidMount(){
    const id = this.props.match.params.appId
    const segmentID = this.props.match.params.segmentID
    this.props.actions.fetchApp(id, ()=>{
      console.log(this.props)
      segmentID ? this.props.actions.fetchAppSegment(segmentID) : null      
    })
    this.props.actions.eventsSubscriber(id)
  }

  componentDidUpdate(prevProps, prevState) {
    if ((prevProps.match && this.props.match) && prevProps.match.params.segmentID !== this.props.match.params.segmentID) {
      
      const id = this.props.match.params.appId
      const segmentID = this.props.match.params.segmentID
      this.props.actions.fetchApp(id, ()=>{
        segmentID ? this.props.actions.fetchAppSegment(segmentID) : null      
      })

    }
  }

  render(){
    return <div>
            { this.props.app.key ? 
              <AppUsers 
                {...this.props}
              /> : null 
            }
          </div>
  }
}

class RootHander extends Component {

  constructor(props){
    super(props)
  }

  componentDidMount(){
    const id = this.props.match.params.appId
    const segmentID = this.props.match.params.segmentID
    this.props.actions.fetchApp(id, ()=>{
      console.log(this.props)
      this.props.actions.fetchAppSegments()      
    })
  }

  componentDidUpdate(prevProps,prevState){
    if(prevProps.segments.length !== this.props.segments.length){
      console.log("redirect")
      this.props.history.push(`/apps/${this.props.app.key}/segments/${this.props.segments[0].id}`)
    }
  }

  render(){
    return <p></p>
  }
}

const ShowApp = ({ match }) => (
  <Fragment>

    <Route exact path={`${match.path}/:appId`} 
      render={(props) => {
        return <Consumer>
                  {({ store, actions }) => (
                    <RootHander {...Object.assign({}, props, store)}
                      actions={actions}
                     />
                  )}
                </Consumer>
      }
    }/>

    <Route path={`${match.path}/:appId/segments/:segmentID?:Jwt?`} 
      render={(props) => (

      <Consumer>
        {({ store, actions }) => (
          <Topic {...Object.assign({}, props, store) }
          store={store} 
          actions={actions}/>
        )}
      </Consumer>

    )}/>

    <Route exact path={match.path} render={() => (
      <h3>Please select a topic.</h3>
    )}/>
  </Fragment>
)

const dropdown = () => (
    <DropdownMenu
      trigger="Choices"
      triggerType="button"
      shouldFlip={false}
      position="right middle"
      onOpenChange={e => console.log('dropdown opened', e)}
    >
      <DropdownItemGroup>
        <DropdownItem>Sydney</DropdownItem>
        <DropdownItem>Melbourne</DropdownItem>
      </DropdownItemGroup>
    </DropdownMenu>
);

const dropdown2 = () => (
    <DropdownMenu
      trigger="Choices"
      triggerType="button"
      shouldFlip={false}
      position="right middle"
      onOpenChange={e => console.log('dropdown opened', e)}
    >
      <DropdownItemGroup>
        <DropdownItem>Sydney</DropdownItem>
        <DropdownItem>Melbourne</DropdownItem>
      </DropdownItemGroup>
    </DropdownMenu>
);

const content = (
  <div>
    <h5>Title</h5>
    <p>Cheesecake gingerbread cupcake soufflé.</p>

    <p>
      Macaroon cupcake powder dragée liquorice fruitcake cookie sesame snaps
      cake.
    </p>
  </div>
);

class InlineDialogExample extends Component {
  state = {
    dialogOpen: false,
  };

  toggleDialog = (e) => this.setState({ dialogOpen: !this.state.dialogOpen });

  render() {
    return (
      <div style={{ minHeight: '120px' }}>
        <InlineDialog 
          content={content} 
          isOpen={this.state.dialogOpen}>

          <Button isLoading={false} 
            appearance={'link'}
            onClick={this.toggleDialog}>
            <i className="fas fa-plus"></i>
            {" "}
            Add filter
          </Button>
        </InlineDialog>
      </div>
    );
  }
}

const parseJwt = (token)=> {
  var isValid = KJUR.jws.JWS.verifyJWT(token, "616161", {alg: ['HS256']});
  if(!isValid)
    return new Error("not a valid jwt, sory")

  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(window.atob(base64));
};

const generateJWT = (data)=>{
  var oHeader = {alg: 'HS256', typ: 'JWT'};
  // Payload
  var oPayload = {};
  var tNow = KJUR.jws.IntDate.get('now');
  var tEnd = KJUR.jws.IntDate.get('now + 1day');
  oPayload.data = data
  // Sign JWT, password=616161
  var sHeader = JSON.stringify(oHeader);
  var sPayload = JSON.stringify(oPayload);
  var sJWT = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, "616161")
  return sJWT
}

class SegmentItemButton extends Component {
  state = {
    dialogOpen: false,
    selectedOption: null
  };

  onRadioChange = (e)=> {
    this.setState({
      selectedOption: e.target.value
    })
  };

  handleSubmit = (e)=> {
    const value = `${this.refs.relative_input.value} days ago`
    const h = {
      comparison: this.state.selectedOption.replace("relative:", ""),
      value: value
    }

    const response = Object.assign({}, this.props.predicate, h )
    this.props.updatePredicate(response)
  }

  content = () => {
  
    const compare = (value)=>{
      return this.props.predicate.comparison === value
    }

    const relative = [
      {label: "more than", value: "relative:lt", defaultSelected: compare("lt")  },
      {label: "exactly", value: "relative:eq",  defaultSelected: compare("lt")  },
      {label: "less than", value: "relative:gt", defaultSelected: compare("lt")  },
    ]
    const absolute = [
      {name: "after", value: "absolute:gt"},
      {name: "on", value: "absolute:eq"},
      {name: "before", value: "absolute:lt"},
      {name: "is unknown", value: "absolute:eq"},
      {name: "has any value", value: "absolute:not_eq"},
    ]

    return <div>
              <h5>Update date</h5>
              <p>Select the filter</p>
              <FieldRadioGroup
                items={relative}
                label="Relative:"
                onRadioChange={this.onRadioChange.bind(this)}
              />

              { this.state.selectedOption ?
                <div>
                  <input 
                    defaultValue={30} 
                    type="number"
                    ref={"relative_input"}/>
                  <span>days ago</span>
                  <hr/>

                  <Button appearance="link" 
                    onClick={this.handleSubmit.bind(this)}>
                    save changes
                  </Button>

                </div> : null
              }
            
            </div>

  }

  toggleDialog = (e) => this.setState({ dialogOpen: !this.state.dialogOpen });

  render() {
    return (
      <div style={{ minHeight: '120px' }}>
        <InlineDialog content={this.content()} 
                      isOpen={this.state.dialogOpen}
                      position={"bottom left"}
                      shouldFlipunion={true}>

          <Button isLoading={false} 
            appearance={this.props.appearance}
            onClick={this.toggleDialog}>
            {this.props.text}
          </Button>
        </InlineDialog>
      </div>
    );
  }
}

class SaveSegmentModal extends Component {
  state: State = { 
    isOpen: false, 
    action: "update",
    loading: false
  };
  open = () => this.setState({ isOpen: true });
  close = () => this.setState({ isOpen: false });
  
  secondaryAction = ({ target }: Object) => {
    this.props.saveSegment(this.state, this.close )
  }

  handleChange = ({target})=> {
    this.setState({
      action: target.value, 
      input: this.refs.input ? this.refs.input.value : null
    })
  }
  
  render() {
    const { isOpen, loading } = this.state;
    const actions = [
      { text: 'Close', onClick: this.close },
      { text: 'Save Segment', onClick: this.secondaryAction.bind(this) },
    ];

    return (
      <div>

        <Button isLoading={false} 
          appearance={'link'}
          onClick={this.open}>
          <i className="fas fa-chart-pie"></i>
          {" "}
          Save Segment
        </Button>

        {isOpen && (
          <Modal actions={actions} 
            onClose={this.close} 
            heading={this.props.title}>
            
            {
              !loading ?
                 <div>
                  <FieldRadioGroup
                    items={
                      [
                        {label: "Save changes to the segment ‘active-artists-es’", value: "update", defaultSelected: true  },
                        {label: "Create new segment", value: "new" },
                      ]
                    }
                    label="options:"
                    onRadioChange={this.handleChange.bind(this)}
                  />

                  {
                    this.state.action === "new" ?
                    <input name="name" ref="input"/> : null
                  }
                </div> : <Spinner/>
            }

          </Modal>
        )}
      </div>
    );
  }
}

export default class ShowAppContainer extends Component {

  constructor(props){
    super(props)
    this.state = {
      app: {}, 
      app_users: [], 
      segments: [],
      segment: {},
      jwt: null
    }

    this.fetchApp         = this.fetchApp.bind(this)
    this.eventsSubscriber = this.eventsSubscriber.bind(this)
    this.fetchAppSegments = this.fetchAppSegments.bind(this)
    this.fetchAppSegment  = this.fetchAppSegment.bind(this)
    this.updatePredicate  = this.updatePredicate.bind(this)
    this.search           = this.search.bind(this)
    this.savePredicates   = this.savePredicates.bind(this)
    this.updateSegment    = this.updateSegment.bind(this)
  }

  componentDidUpdate(prevProps, prevState) {
    // only update chart if the data has changed
    if (prevState.jwt !== this.state.jwt) {
        this.search()
    }

    if (prevState.segment.id !== this.state.segment.id) {
      this.fetchApp(this.state.app.key, ()=>{
        this.search()
      })
    }
  }

  fetchApp(id, cb){
    const t = this
    axios.get(`/apps/${id}.json`)
    .then( (response)=> {
      t.setState({app: response.data.app}, ()=>{ 
        this.fetchAppSegments()
        cb ? cb() : null
      })
    })
    .catch( (error)=> {
      console.log(error);
    });
  }

  search(){
    // jwt or predicates from segment
    console.log(this.state.jwt)
    const data = this.state.jwt ? parseJwt(this.state.jwt).data : this.state.segment.predicates
    const predicates_data = { data: {
                                predicates: data
                              }
                            }

    axios.post(`/apps/${this.state.app.key}/search.json`, 
      predicates_data )
    .then( (response)=> {
      console.log(this.state)
      console.log(data)
      this.setState({
        segment: Object.assign({}, this.state.segment, { predicates: data }),
        app_users: response.data.collection
      })
    })
    .catch( (error)=> {
      console.log(error);
    });   
  }

  fetchAppSegments(){
    axios.get(`/apps/${this.state.app.key}/segments.json`)
    .then( (response)=> {
      this.setState({segments: response.data.collection},
        this.updateNavLinks
      )
    })
    .catch( (error)=> {
      console.log(error);
    });
  }

  fetchAppSegment(id){
    axios.get(`/apps/${this.state.app.key}/segments/${id}.json`)
    .then( (response)=> {
      this.setState({
        segment: response.data.segment,
        //app_users: response.data.collection
      }, this.search)
    })
    .catch( (error)=> {
      console.log(error);
    });
  }

  updateNavLinks(){
    //const links = this.state.segments //.concat(["/oooijoij", "Home", null])
    const links = this.state.segments.map((o)=> [o.url, o.name, null] )
    this.props.updateNavLinks(this.props.initialNavLinks.concat(links))
  }

  updateUser(data){
   
    data = JSON.parse(data)
    this.setState({app_users: this.state.app_users.map( (el)=> 
        el.email === data.email ? Object.assign({}, el, data) : el 
      )
    });
  }

  eventsSubscriber(id){
    CableApp.events = CableApp.cable.subscriptions.create({
      channel: "EventsChannel",
      app: id
    },
    {
        connected: ()=> {
          console.log("connected to events")
        },
        disconnected: ()=> {
          console.log("disconnected from events")
        },
        received: (data)=> {
          this.updateUser(data)
          console.log(`received ${data}`)
        },
        notify: ()=>{
          console.log(`notify!!`)
        },
        handleMessage: (message)=>{
          console.log(`handle message`)
        } 
      });
  }

  updatePredicate(data){

    const new_predicates = this.state.segment.predicates.map((o)=> {
      if(data.attribute === o.attribute){
        return data
      } else {
        return o
      }
    })
    const jwtToken = generateJWT(new_predicates)
    
    console.log(parseJwt(jwtToken))
 
    const url = `/apps/${this.state.app.key}/segments/${this.state.segment.id}:${jwtToken}`
    
    this.props.history.push(url)
    
    this.setState({jwt: jwtToken})
  }

  actions(){
    return {
      fetchApp: this.fetchApp,
      eventsSubscriber: this.eventsSubscriber,
      fetchAppSegment: this.fetchAppSegment,
      fetchAppSegments: this.fetchAppSegments
    }
  }

  getPredicates(){
    return this.state.segment["predicates"] || []
  }

  updateSegment = (data, cb)=>{
    axios.put(`/apps/${this.state.app.key}/segments/${this.state.segment.id}.json`, 
      {
        segment: {
          id: this.state.segment.id,
          predicates: this.state.segment.predicates
        }
      }
    )
    .then( (response)=> {
      this.setState({
        segment: response.data.segment
      }, ()=> cb ? cb() : null )
    })
    .catch( (error)=> {
      console.log(error);
    })
  }

  createSegment = (data, cb)=>{
    axios.post(`/apps/${this.state.app.key}/segments.json`, 
      {
        segment: {
          name: data.name,
          predicates: this.state.segment.predicates
        }
      }
    )
    .then( (response)=> {
      this.setState({
        segment: response.data.segment
      }, ()=> {
        cb ? cb() : null 
        const url = `/apps/${this.state.app.key}/segments/${this.state.segment.id}`
        this.props.history.push(url)
        //this.fetchAppSegments() ; cb ? cb() : null 
      })
    })
    .catch( (error)=> {
      console.log(error);
    })
  }

  savePredicates(data, cb){
    console.log(data.action)
    if(data.action === "update"){
      this.updateSegment(data, cb)
    } else if(data.action === "new"){
      this.createSegment(data, cb)
    }
  }

  render(){
    return <Provider value={{
                              store: this.state, 
                              actions: this.actions() 
                            }}>

      <ContentWrapper>

        <PageTitle>
          App: {this.state.app.key}
        </PageTitle>

        <ButtonGroup>
          
          {
            this.getPredicates().map((o, i)=>{
              return <SegmentItemButton 
                        key={i}
                        predicate={o}
                        appearance="primary"
                        updatePredicate={this.updatePredicate}
                        text={`Match: ${o.attribute} ${o.comparison} ${o.value}`}
                      />
            })
          }

          <InlineDialogExample/>

          <SaveSegmentModal 
            title="Save Segment" 
            saveSegment={this.savePredicates}/>

          {
            /*
              <Button
                appearance="primary"
                onClick={this.context.showModal}
                onClose={() => { }}
              >Match All users</Button>

              <Button onClick={this.context.addFlag}>
                Match all filters
              </Button>

              <InlineDialogExample/>

              {dropdown()}
            */
          }

        </ButtonGroup>

        <hr/>

        <ShowApp 
          match={this.props.match} 
        />

      </ContentWrapper>


    </Provider>
  }
}