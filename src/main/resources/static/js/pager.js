/**
 * Paging library by won
 */

'use strict';
let Pager = function (pager) {

    // Controller ID
    this.id = pager.id;

    // Form
    this.form = null;

    // Modal search filter
    this.modal = null;

    // Bootstrap table
    this.table = null;

    // Filter
    this.filter = null;

    // URL to request
    this.url = null;

    // Data queue (fast-paging-only)
    this.log = null;

    // Navigation button elements (fast-paging-only)
    this.navigationButtonGroup = {
        page: null,
        prev: null,
        next: null,
    };

    // Paging variables (fast-paging-only)
    this.paging = null;

    // Previous paging mode
    this.pagingMode = null;

    // Extra parameter
    this.extraParam = null;

    // Show loading
    this.showLoading = null;

    this.isInModal = null;

    this.paginationVAlign = null;

    this.toolbar = null;

    // Check filtering in modal
    this.isFilteredInModal = function() {
        let filtered = false;

        // Check text boxes
        $(".modal-body input[type=text]", this.form).not(".exception").each(function (i, elm) {
            if ($(elm).val().trim().length > 0) {
                filtered = true;
                return false;
            }
        });

        // Check select box
        $(".modal-body select", this.form).each(function (i, elm) {
            if ($("option:selected", $(elm)).length > 0) {
                filtered = true;
                return false;
            }
        });

        // console.debug(" - filtered in modal? " + filtered);
        return filtered;
    };


    // Set sorting options (fast-paging-only)
    this.setSort = function (name, order) {
        this.paging.sort = name;
        this.paging.order = order;

        // for Ajax request of bootstrap-table
        this.table.bootstrapTable("refreshOptions", {
            sortName: name,
            sortOrder: order,
        });

        // console.debug("sorting is changed to " + name + " / " + order);
    };

    this.setExtraParam = function(param) {
        this.extraParam = param;
    };

    // Refresh table (General paging only)
    this.refreshTable = function() {
        this.table.bootstrapTable("refresh");
    };

    // Fetch page (fast-paging-only)
    this.fetchPage = function (direction, refresh = false) {
        if (direction === undefined) {
            direction = 0;
        }

        // if (refresh === undefined) {
        //     refresh = false;
        // }
        console.debug("move page: direction=" + direction + ", refresh=" + refresh);

        // Calculate page
        this.paging.no += direction; // Page to search
        if (this.paging.no < 1) {
            this.paging.no = 1;
        }
        this.paging.blockIndex = Math.floor((this.paging.no - 1) / this.paging.blockSize);
        console.debug(this.paging);

        // Fetch and display data
        if ((this.paging.blockIndex !== this.paging.blockIndex_before) || refresh) {
            console.debug(" - need to fetch data");
            let pagingParam = {
                page: Math.ceil(this.paging.no / this.paging.blockSize),
                size: this.paging.size * this.paging.blockSize,
                sort: this.paging.sort,
                order: this.paging.order,
            };
            console.debug(pagingParam);

            let url = "/" + this.api + "?" + $.param(this.filter, true) + "&" + $.param(pagingParam, true);
            if (this.extraParam !== null) {
                url += "&" + $.param(this.extraParam, true);
            }
            let c = this;

            // Show loading
            if (this.showLoading) {
                c.table.bootstrapTable("showLoading");
            }

            $.ajax({
                url: url,
            }).done(function (data) {
                // console.log(data);
                c.log = data;

                // Set row number
                $.each(c.log, function(i) {
                    c.log[i]["__ROWNUM__"] = (c.paging.blockIndex * c.paging.size * c.paging.blockSize) + i + 1;
                });

                c.paging.dataLength = c.log.length;
                c.renderDataToTable(c.log);
                c.updatePagingNavButtons();
                c.navigationButtonGroup.page.text(c.paging.no);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                //console.error(jqXHR);
                // Swal.fire("Error", jqXHR.message, "warning");
            }).always(function() {
                // Hide loading
                if (c.showLoading) {
                    c.table.bootstrapTable("hideLoading");
                }
            });
        } else {
            this.renderDataToTable(this.log);
            this.updatePagingNavButtons();
            this.navigationButtonGroup.page.text(this.paging.no);
        }
        this.paging.blockIndex_before = this.paging.blockIndex;
    };

    // Refresh table (General paging only)
    this.refresh = function() {
        this.updateFilter();
        $('.has-popover').popover("hide");
        if (this.filter.pagingMode === PagingModes.FastPaging) {
            this.fetchPage(0, true);
            return;
        }
        this.table.bootstrapTable("refresh");
    };


    // Render data to table (fast-paging-only)
    this.renderDataToTable = function(logs) {
        if (logs === null) return;

        let begin = ((this.paging.no - 1) % this.paging.blockSize) * this.paging.size,
            end = begin + this.paging.size;
        this.table.bootstrapTable("load", logs.slice(begin, end));
        // console.debug("render data to table: queueSize="+logs.length + ", begin="+begin+", end="+end);
        $('.has-tooltip').tooltip();
        $('.has-popover').popover();
    };


    this.initForm = function () {

        // Set form
        this.form = $("#form-" + this.id);
        this.toolbar = $("#toolbar-" + this.id);

        // Set modal of filter
        this.isInModal = false;
        if (pager.isInModal !== undefined){
            this.isInModal = pager.isInModal;
        }
        if (this.isInModal) {
            this.modal = $("#modal-" + this.id);
            // console.debug("pager is in modal");
        } else {
            this.modal = $("#modal-" + this.id + "-filter");
        }

        // Set datetime input
        $(".datetime-startDate").daterangepicker(dateStartOption);
        $(".datetime-endDate").daterangepicker(dateEndOption);
        $(".datetime-range").daterangepicker(dateRangeOption);

        // Set URL to request
        this.api = this.id;
        if (pager.api !== undefined) {
            this.api = pager.api;
        }

        // Set loading
        this.showLoading = true;
        if (pager.showLoading !== undefined) {
            this.showLoading = pager.showLoading;
        }

        this.paginationVAlign = "both";
        if (pager.paginationVAlign !== undefined) {
            this.paginationVAlign = pager.paginationVAlign;
        }

        // Update filter
        this.updateFilter();

        // Set paging mode
        this.pagingMode = this.filter.pagingMode;
        // console.debug("set paging mode: " + this.pagingMode);
    };

    this.initFormValidation = function() {

        // Set validation rules of form
        let rules =  {
            pageSize: {
                required: true,
                min: 2,
                max: 200,
            },
            sTime: {
                startTime: true
            },
            eTime: {
                endTime: true
            }
        };
        if (pager.rules !== undefined) {
            Object.assign(rules, pager.rules);
        }

        let c = this;
        this.form.validate({
            submitHandler: function (form, e) {
                e.preventDefault();

                // Update filter
                c.updateFilter();
                if (c.pagingMode !== c.filter.pagingMode) {
                    // console.log($(form).serializeArray());
                    form.submit();
                    return true;
                }
                console.debug("previous paging mode: " + c.pagingMode);
                console.debug("--------submitted--------");

                // if modal is opened, close it
                if (c.modal.hasClass("show")) {
                    c.modal.modal("toggle");
                }
                // console.log(c.filter);
                if (c.filter.pagingMode === PagingModes.FastPaging) {
                    c.table.bootstrapTable("refreshOptions", {
                        pageSize: c.filter.pageSize,
                    });
                    c.initPaging();
                    c.fetchPage(0, true);
                    return true;
                }
                c.table.bootstrapTable("refresh");
                c.table.bootstrapTable("selectPage", 1);
            },
            rules: rules
        });
    };


    // Update filter
    this.updateFilter = function() {
        this.filter = objectifyForm(this.form);
        this.filter.pagingMode = this.filter.pagingMode || PagingModes.FastPaging;
        // if (this.filter.startDate !== undefined) {
        //     this.filter.startDate += ":00" + Member.tz;
        // }
        // if (this.filter.endDate !== undefined) {
        //     this.filter.endDate += ":00" + Member.tz;
        // }
        // this.filter.startDate += ":00" + member.tzOffset;
        // this.filter.endDate += ":59" + member.tzOffset;
        // console.debug("filter is updated: pagingMode="+ this.filter.pagingMode);
        if (this.isFilteredInModal()) {
            $(".filter", this.form).html('<i class="fas fa-filter text-danger"></i>');
        }
        // console.log(this.filter);
    };


    // Initialize paging variables (fast-paging-only)
    this.initPaging = function () {
        this.paging = {
            no: 1, // Page number
            blockIndex: 0, // Block index
            blockIndex_before: -1, // Previous block index
            blockSize: pager.blockSize || 5, // fetch N pages of data at a time
            dataLength: 0,
            size: parseInt(this.table.bootstrapTable("getOptions").pageSize, 10), // Page size
            sort: this.table.bootstrapTable("getOptions").sortName,
            order: this.table.bootstrapTable("getOptions").sortOrder,
        };
        // console.debug("paging is initialized");
    }


    // Initialize navigation button group (fast-paging-only)
    this.initNavigationButtonGroup = function () {
        this.navigationButtonGroup.page = $(".btn-page-text", this.toolbar);
        this.navigationButtonGroup.prev = $(".btn-page-prev", this.toolbar);
        this.navigationButtonGroup.next = $(".btn-page-next", this.toolbar);

        let c = this;
        $(".btn-move-page", this.toolbar).click(function () {
            c.fetchPage($(this).data("direction"), false);
        });
    };


    // Initialize bootstrap-table for fast paging
    this.initTableForFastPaging = function () {
        let c = this;

        this.table = $("#table-" + this.id).bootstrapTable({
            sidePagination: "client", // Client-side pagination
            pageSize: c.filter.pageSize,

        }).on("refresh.bs.table", function () {
            // Fetch page
            c.fetchPage(0, true);

        }).on("sort.bs.table", function (e, name, order) { // Refresh
            c.setSort(name, order);
            c.fetchPage(0, true);
        });
        // console.debug("table is initialized for fast paging");

        // Initialize paging
        this.initPaging();
    };


    // Initialize bootstrap-table for general paging
    this.initTableForGeneralPaging = function () {
        let c = this;
        this.table = $("#table-" + this.id).bootstrapTable({
            sidePagination: "server",
            url: "/" + this.api,
            queryParamsType: "", // DO NOT REMOVE. LEAVE BLANK
            pagination: true,
            paginationVAlign: c.paginationVAlign,
            queryParams: function (param) {
                let filter =  $.extend({}, c.filter);
                Object.assign(filter, {
                    size: param.pageSize,
                    page: param.pageNumber,
                    sort: param.sortName,
                    order: param.sortOrder,
                });
                return $.param(filter, true);
            },
            // responseHandler: function (data) {
            //     return {
            //         total: data.totalElements,
            //         rows: data.content
            //     };
            // }
        // }).on("column-switch.bs.table", function () {
        //     captureTableColumnsState($(this));

        }).on("load-success.bs.table", function () {
            $('.has-tooltip').tooltip();
            $('.has-popover').popover();

        }).on("sort.bs.table", function (e, name, order) { // Refresh
            // for Post request
            //$("input[name=sort]", c.form).val(name + "," + order);
        });
    };

    this.updatePagingNavButtons = function() {
        let offset = ((this.paging.no - 1 ) % this.paging.blockSize) * this.paging.size;
        this.navigationButtonGroup.prev.prop("disabled", this.paging.no === 1)
        this.navigationButtonGroup.next.prop("disabled", (this.paging.dataLength - offset) < this.paging.size);
    };


    // Initialize module
    this.init = function () {
        // Initialize form and validation
        this.initForm();
        this.initFormValidation();

        // Fast paging mode
        if (this.filter.pagingMode === PagingModes.FastPaging) {
            this.initTableForFastPaging();
            this.initNavigationButtonGroup();
            return true;
        }

        // General paging mode
        this.initTableForGeneralPaging();
    };

    this.run = function() {
        this.updateFilter();

        if (this.filter.pagingMode === PagingModes.FastPaging) {
            this.fetchPage();
        }
    };

    this.reset = function() {
        this.initPaging();
        this.log = [];
        this.table.bootstrapTable("removeAll");
        this.extraParam = null;
    };

    this.init();
};
